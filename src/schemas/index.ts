import z from "zod";
import { WeekDay } from "../generated/prisma/enums.js";

export const ErrorSchema = z.object({
	error: z.string(),
	code: z.string(),
});

export const WorkoutPlanSchema = z.object({
	id: z.uuid(),
	name: z.string().trim().min(1),
	workoutDays: z.array(
		z.object({
			name: z.string().trim().min(1),
			coverImageUrl: z.url().optional(),
			weekDay: z.enum(WeekDay),
			isRest: z.boolean().default(false),
			estimatedDurationInSeconds: z.number().min(1),
			exercises: z.array(
				z.object({
					order: z.number().min(0).positive(),
					name: z.string().trim().min(1),
					sets: z.number().min(1),
					reps: z.number().min(1),
					restTimeInSeconds: z.number().min(1),
				}),
			),
		}),
	),
});

export const GetWorkoutPlanParamsSchema = z.object({
	id: z.uuid(),
});

export const GetWorkoutPlanResponseSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	workoutDays: z.array(
		z.object({
			id: z.uuid(),
			weekDay: z.enum(WeekDay),
			name: z.string(),
			isRest: z.boolean(),
			coverImageUrl: z.url().optional(),
			estimatedDurationInSeconds: z.number().int(),
			exercisesCount: z.number().int().min(0),
		}),
	),
});

export const GetWorkoutDayParamsSchema = z.object({
	workoutPlanId: z.uuid(),
	workoutDayId: z.uuid(),
});

export const GetWorkoutDayResponseSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	isRest: z.boolean(),
	coverImageUrl: z.url().optional(),
	estimatedDurationInSeconds: z.number().int(),
	weekDay: z.enum(WeekDay),
	exercises: z.array(
		z.object({
			id: z.uuid(),
			name: z.string(),
			order: z.number().int(),
			workoutDayId: z.uuid(),
			sets: z.number().int(),
			reps: z.number().int(),
			restTimeInSeconds: z.number().int(),
		}),
	),
	sessions: z.array(
		z.object({
			id: z.uuid(),
			workoutDayId: z.uuid(),
			startedAt: z.string().optional(),
			completedAt: z.string().optional(),
		}),
	),
});

export const StatsQuerySchema = z
	.object({
		from: z.iso.date(),
		to: z.iso.date(),
	})
	.refine((data) => data.from <= data.to, {
		path: ["to"],
		message: "The to date must be after or equal to the from date",
	});

export const StatsResponseSchema = z.object({
	workoutStreak: z.number().int().min(0),
	consistencyByDay: z.record(
		z.iso.date(),
		z.object({
			workoutDayCompleted: z.boolean(),
			workoutDayStarted: z.boolean(),
		}),
	),
	completedWorkoutsCount: z.number().int().min(0),
	conclusionRate: z.number().min(0).max(1),
	totalTimeInSeconds: z.number().int().min(0),
});

export const StartWorkoutSessionBodySchema = z.object({});

export const StartWorkoutSessionQuerySchema = z.object({});

export const StartWorkoutSessionParamsSchema = z.object({
	workoutPlanId: z.uuid(),
	workoutDayId: z.uuid(),
});

export const StartWorkoutSessionResponseSchema = z.object({
	userWorkoutSessionId: z.uuid(),
});

export const UpdateWorkoutSessionBodySchema = z.object({
	completedAt: z.string().datetime(),
});

export const UpdateWorkoutSessionQuerySchema = z.object({});

export const UpdateWorkoutSessionParamsSchema = z.object({
	workoutPlanId: z.uuid(),
	workoutDayId: z.uuid(),
	workoutSessionId: z.uuid(),
});

export const UpdateWorkoutSessionResponseSchema = z.object({
	id: z.uuid(),
	startedAt: z.string().datetime(),
	completedAt: z.string().datetime(),
});

export const HomeParamsSchema = z.object({
	date: z.iso.date(),
});

export const HomeResponseSchema = z.object({
	activeWorkoutPlanId: z.uuid(),
	todayWorkoutDay: z.object({
		workoutPlanId: z.uuid(),
		id: z.uuid(),
		name: z.string(),
		isRest: z.boolean(),
		weekDay: z.enum(WeekDay),
		estimatedDurationInSeconds: z.number().int(),
		coverImageUrl: z.url().optional(),
		exercisesCount: z.number().int().min(0),
	}),
	workoutStreak: z.number().int().min(0),
	consistencyByDay: z.record(
		z.iso.date(),
		z.object({
			workoutDayCompleted: z.boolean(),
			workoutDayStarted: z.boolean(),
		}),
	),
});
