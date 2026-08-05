import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { ForbiddenError, NotFoundError } from "../errors/index.js";
import type { WeekDay } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

dayjs.extend(utc);

interface InputDto {
	userId: string;
	workoutPlanId: string;
	workoutDayId: string;
}

interface OutputDto {
	id: string;
	name: string;
	isRest: boolean;
	coverImageUrl?: string;
	estimatedDurationInSeconds: number;
	weekDay: WeekDay;
	exercises: Array<{
		id: string;
		name: string;
		order: number;
		workoutDayId: string;
		sets: number;
		reps: number;
		restTimeInSeconds: number;
	}>;
	sessions: Array<{
		id: string;
		workoutDayId: string;
		startedAt: string;
		completedAt?: string;
	}>;
}

export class GetWorkoutDay {
	async execute(dto: InputDto): Promise<OutputDto> {
		const workoutDay = await prisma.workoutDay.findUnique({
			where: { id: dto.workoutDayId },
			select: {
				id: true,
				name: true,
				isRest: true,
				coverImageUrl: true,
				estimatedDurationInSeconds: true,
				weekDay: true,
				workoutPlan: {
					select: {
						id: true,
						userId: true,
					},
				},
				exercises: {
					select: {
						id: true,
						name: true,
						order: true,
						workoutDayId: true,
						sets: true,
						reps: true,
						restTimeInSeconds: true,
					},
				},
				sessions: {
					select: {
						id: true,
						workoutDayId: true,
						startedAt: true,
						completedAt: true,
					},
					orderBy: { startedAt: "desc" },
				},
			},
		});

		if (!workoutDay || workoutDay.workoutPlan.id !== dto.workoutPlanId) {
			throw new NotFoundError("Workout day not found");
		}

		if (workoutDay.workoutPlan.userId !== dto.userId) {
			throw new ForbiddenError("You do not have access to this workout plan");
		}

		return {
			id: workoutDay.id,
			name: workoutDay.name,
			isRest: workoutDay.isRest,
			coverImageUrl: workoutDay.coverImageUrl ?? undefined,
			estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
			weekDay: workoutDay.weekDay,
			exercises: workoutDay.exercises,
			sessions: workoutDay.sessions.map((session) => ({
				id: session.id,
				workoutDayId: session.workoutDayId,
				startedAt: dayjs.utc(session.startedAt).format("YYYY-MM-DD"),
				completedAt: session.completedAt
					? dayjs.utc(session.completedAt).format("YYYY-MM-DD")
					: undefined,
			})),
		};
	}
}
