import { ForbiddenError, NotFoundError } from "../errors/index.js";
import type { WeekDay } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

interface InputDto {
	userId: string;
	id: string;
}

interface OutputDto {
	id: string;
	name: string;
	workoutDays: Array<{
		id: string;
		weekDay: WeekDay;
		name: string;
		isRest: boolean;
		coverImageUrl?: string;
		estimatedDurationInSeconds: number;
		exercisesCount: number;
	}>;
}

export class GetWorkoutPlan {
	async execute(dto: InputDto): Promise<OutputDto> {
		const workoutPlan = await prisma.workoutPlan.findUnique({
			where: { id: dto.id },
			select: {
				id: true,
				name: true,
				userId: true,
				workoutDays: {
					select: {
						id: true,
						weekDay: true,
						name: true,
						isRest: true,
						coverImageUrl: true,
						estimatedDurationInSeconds: true,
						_count: {
							select: { exercises: true },
						},
					},
				},
			},
		});

		if (!workoutPlan) {
			throw new NotFoundError("Workout plan not found");
		}

		if (workoutPlan.userId !== dto.userId) {
			throw new ForbiddenError("You do not have access to this workout plan");
		}

		return {
			id: workoutPlan.id,
			name: workoutPlan.name,
			workoutDays: workoutPlan.workoutDays.map((workoutDay) => ({
				id: workoutDay.id,
				weekDay: workoutDay.weekDay,
				name: workoutDay.name,
				isRest: workoutDay.isRest,
				coverImageUrl: workoutDay.coverImageUrl ?? undefined,
				estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
				exercisesCount: workoutDay._count.exercises,
			})),
		};
	}
}
