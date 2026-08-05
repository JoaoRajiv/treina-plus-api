import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { NotFoundError } from "../errors/index.js";
import { WeekDay } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

dayjs.extend(utc);

interface InputDto {
	userId: string;
	date: string;
}

interface OutputDto {
	activeWorkoutPlanId: string;
	todayWorkoutDay: {
		workoutPlanId: string;
		id: string;
		name: string;
		isRest: boolean;
		weekDay: WeekDay;
		estimatedDurationInSeconds: number;
		coverImageUrl?: string;
		exercisesCount: number;
	};
	workoutStreak: number;
	consistencyByDay: Record<
		string,
		{
			workoutDayCompleted: boolean;
			workoutDayStarted: boolean;
		}
	>;
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

export class GetHomeData {
	async execute(dto: InputDto): Promise<OutputDto> {
		const requestedDate = dayjs.utc(dto.date);
		const requestedWeekDay = weekDays[requestedDate.day()];

		const workoutPlan = await prisma.workoutPlan.findFirst({
			where: {
				userId: dto.userId,
				isActive: true,
			},
			select: {
				id: true,
				workoutDays: {
					select: {
						id: true,
						name: true,
						isRest: true,
						weekDay: true,
						estimatedDurationInSeconds: true,
						coverImageUrl: true,
						_count: {
							select: { exercises: true },
						},
					},
				},
			},
		});

		if (!workoutPlan) {
			throw new NotFoundError("Active workout plan not found");
		}

		const todayWorkoutDay = workoutPlan.workoutDays.find(
			(workoutDay) => workoutDay.weekDay === requestedWeekDay,
		);

		if (!todayWorkoutDay) {
			throw new NotFoundError("Workout day not found for the requested date");
		}

		const weekStart = requestedDate.startOf("week");
		const weekEnd = requestedDate.endOf("week");
		const userSessionWhere = {
			workoutDay: {
				workoutPlan: {
					userId: dto.userId,
				},
			},
		};

		const sessionsInWeek = await prisma.workoutSession.findMany({
			where: {
				...userSessionWhere,
				startedAt: {
					gte: weekStart.toDate(),
					lte: weekEnd.toDate(),
				},
			},
			select: {
				startedAt: true,
				completedAt: true,
			},
		});

		const completedSessions = await prisma.workoutSession.findMany({
			where: {
				...userSessionWhere,
				startedAt: { lte: requestedDate.endOf("day").toDate() },
				completedAt: { not: null },
			},
			select: { startedAt: true },
		});

		const consistencyByDay = Object.fromEntries(
			Array.from({ length: 7 }, (_, index) => {
				const date = weekStart.add(index, "day");
				const dateKey = date.format("YYYY-MM-DD");
				const sessionsForDay = sessionsInWeek.filter(
					(session) =>
						dayjs.utc(session.startedAt).format("YYYY-MM-DD") === dateKey,
				);

				return [
					dateKey,
					{
						workoutDayCompleted: sessionsForDay.some(
							(session) => session.completedAt !== null,
						),
						workoutDayStarted: sessionsForDay.length > 0,
					},
				];
			}),
		);

		const completedDates = new Set(
			completedSessions.map((session) =>
				dayjs.utc(session.startedAt).format("YYYY-MM-DD"),
			),
		);
		const scheduledWeekDays = new Set(
			workoutPlan.workoutDays.map((workoutDay) => workoutDay.weekDay),
		);
		let workoutStreak = 0;
		let streakDate = requestedDate;

		while (true) {
			const streakDateKey = streakDate.format("YYYY-MM-DD");
			const streakWeekDay = weekDays[streakDate.day()];

			if (scheduledWeekDays.has(streakWeekDay)) {
				if (!completedDates.has(streakDateKey)) break;
				workoutStreak++;
			}

			streakDate = streakDate.subtract(1, "day");
		}

		return {
			activeWorkoutPlanId: workoutPlan.id,
			todayWorkoutDay: {
				workoutPlanId: workoutPlan.id,
				id: todayWorkoutDay.id,
				name: todayWorkoutDay.name,
				isRest: todayWorkoutDay.isRest,
				weekDay: todayWorkoutDay.weekDay,
				estimatedDurationInSeconds: todayWorkoutDay.estimatedDurationInSeconds,
				coverImageUrl: todayWorkoutDay.coverImageUrl ?? undefined,
				exercisesCount: todayWorkoutDay._count.exercises,
			},
			workoutStreak,
			consistencyByDay,
		};
	}
}
