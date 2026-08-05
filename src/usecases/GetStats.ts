import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { WeekDay } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

dayjs.extend(utc);

interface InputDto {
	userId: string;
	from: string;
	to: string;
}

interface OutputDto {
	workoutStreak: number;
	consistencyByDay: Record<
		string,
		{
			workoutDayCompleted: boolean;
			workoutDayStarted: boolean;
		}
	>;
	completedWorkoutsCount: number;
	conclusionRate: number;
	totalTimeInSeconds: number;
}

const weekDays: WeekDay[] = [
	WeekDay.SUNDAY,
	WeekDay.MONDAY,
	WeekDay.TUESDAY,
	WeekDay.WEDNESDAY,
	WeekDay.THURSDAY,
	WeekDay.FRIDAY,
	WeekDay.SATURDAY,
];

export class GetStats {
	async execute(dto: InputDto): Promise<OutputDto> {
		const from = dayjs.utc(dto.from).startOf("day");
		const to = dayjs.utc(dto.to).endOf("day");
		const sessions = await prisma.workoutSession.findMany({
			where: {
				workoutDay: {
					workoutPlan: {
						userId: dto.userId,
					},
				},
				startedAt: {
					gte: from.toDate(),
					lte: to.toDate(),
				},
			},
			select: {
				startedAt: true,
				completedAt: true,
				workoutDay: {
					select: {
						weekDay: true,
					},
				},
			},
		});

		const consistencyByDay: OutputDto["consistencyByDay"] = {};
		let completedWorkoutsCount = 0;
		let totalTimeInSeconds = 0;
		const completedDates = new Set<string>();

		for (const session of sessions) {
			const dateKey = dayjs.utc(session.startedAt).format("YYYY-MM-DD");
			if (!consistencyByDay[dateKey]) {
				consistencyByDay[dateKey] = {
					workoutDayCompleted: false,
					workoutDayStarted: false,
				};
			}
			const dayStats = consistencyByDay[dateKey];

			dayStats.workoutDayStarted = true;

			if (session.completedAt) {
				dayStats.workoutDayCompleted = true;
				completedWorkoutsCount++;
				completedDates.add(dateKey);
				totalTimeInSeconds += Math.max(
					0,
					Math.floor(
						(session.completedAt.getTime() - session.startedAt.getTime()) /
							1000,
					),
				);
			}
		}

		const workoutPlans = await prisma.workoutPlan.findMany({
			where: { userId: dto.userId },
			select: {
				workoutDays: {
					select: { weekDay: true },
				},
			},
		});
		const scheduledWeekDays = new Set(
			workoutPlans.flatMap((plan) =>
				plan.workoutDays.map((workoutDay) => workoutDay.weekDay),
			),
		);

		let workoutStreak = 0;
		let streakDate = from.startOf("day");
		const lastDate = to.startOf("day");

		while (streakDate.isBefore(lastDate) || streakDate.isSame(lastDate)) {
			const dateKey = streakDate.format("YYYY-MM-DD");
			const weekDay = weekDays[streakDate.day()];

			if (scheduledWeekDays.has(weekDay)) {
				if (!completedDates.has(dateKey)) {
					workoutStreak = 0;
				} else {
					workoutStreak++;
				}
			}

			streakDate = streakDate.add(1, "day");
		}

		return {
			workoutStreak,
			consistencyByDay,
			completedWorkoutsCount,
			conclusionRate:
				sessions.length === 0 ? 0 : completedWorkoutsCount / sessions.length,
			totalTimeInSeconds,
		};
	}
}
