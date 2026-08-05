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
		z.string(),
		z.object({
			workoutDayCompleted: z.boolean(),
			workoutDayStarted: z.boolean(),
		}),
	),
});
