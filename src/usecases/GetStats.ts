import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { prisma } from "../lib/db.js";
import { calculateWorkoutStreak } from "../utils/workoutStreak.js";

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
					select: { isRest: true },
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
				if (!session.workoutDay.isRest) {
					completedDates.add(dateKey);
				}
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
					where: { isRest: false },
					select: { weekDay: true },
				},
			},
		});
		const scheduledWeekDays = new Set(
			workoutPlans.flatMap((plan) =>
				plan.workoutDays.map((workoutDay) => workoutDay.weekDay),
			),
		);

		const workoutStreak = calculateWorkoutStreak({
			from,
			to,
			completedDates,
			scheduledWeekDays,
		});

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
