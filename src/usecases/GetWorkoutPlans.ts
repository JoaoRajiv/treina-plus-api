import type { WeekDay } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

interface InputDto {
	userId: string;
	active?: boolean;
}

interface OutputDto {
	id: string;
	name: string;
	isActive: boolean;
	workoutDays: Array<{
		id: string;
		name: string;
		weekDay: WeekDay;
		isRest: boolean;
		coverImageUrl?: string;
		estimatedDurationInSeconds: number;
		exercises: Array<{
			id: string;
			name: string;
			order: number;
			workoutDayId: string;
			sets: number;
			reps: number;
			restTimeInSeconds: number;
		}>;
	}>;
}

export class GetWorkoutPlans {
	async execute(dto: InputDto): Promise<OutputDto[]> {
		const workoutPlans = await prisma.workoutPlan.findMany({
			where: {
				userId: dto.userId,
				...(dto.active === undefined ? {} : { isActive: dto.active }),
			},
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				name: true,
				isActive: true,
				workoutDays: {
					select: {
						id: true,
						name: true,
						weekDay: true,
						isRest: true,
						coverImageUrl: true,
						estimatedDurationInSeconds: true,
						exercises: {
							orderBy: { order: "asc" },
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
					},
				},
			},
		});

		return workoutPlans.map((workoutPlan) => ({
			...workoutPlan,
			workoutDays: workoutPlan.workoutDays.map((workoutDay) => ({
				...workoutDay,
				coverImageUrl: workoutDay.coverImageUrl ?? undefined,
			})),
		}));
	}
}
