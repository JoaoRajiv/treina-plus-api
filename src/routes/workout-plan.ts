import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { sendError, UnauthorizedError } from "../errors/index.js";
import { auth } from "../lib/auth.js";
import {
	ErrorSchema,
	GetWorkoutDayParamsSchema,
	GetWorkoutDayResponseSchema,
	GetWorkoutPlanParamsSchema,
	GetWorkoutPlanResponseSchema,
	GetWorkoutPlansQuerySchema,
	GetWorkoutPlansResponseSchema,
	StartWorkoutSessionBodySchema,
	StartWorkoutSessionParamsSchema,
	StartWorkoutSessionQuerySchema,
	StartWorkoutSessionResponseSchema,
	UpdateWorkoutSessionBodySchema,
	UpdateWorkoutSessionParamsSchema,
	UpdateWorkoutSessionQuerySchema,
	UpdateWorkoutSessionResponseSchema,
	WorkoutPlanSchema,
} from "../schemas/index.js";
import { CreateWorkoutPlan } from "../usecases/CreateWorkoutPlan.js";
import { GetWorkoutDay } from "../usecases/GetWorkoutDay.js";
import { GetWorkoutPlan } from "../usecases/GetWorkoutPlan.js";
import { GetWorkoutPlans } from "../usecases/GetWorkoutPlans.js";
import { StartWorkoutSession } from "../usecases/StartWorkoutSession.js";
import { UpdateWorkoutSession } from "../usecases/UpdateWorkoutSession.js";

export const workoutPlanRoutes = async (app: FastifyInstance) => {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/workout-plans",
		schema: {
			operationId: "listWorkoutPlans",
			tags: ["Workout Plan"],
			summary: "List workout plans with days and exercises",
			querystring: GetWorkoutPlansQuerySchema,
			response: {
				200: GetWorkoutPlansResponseSchema,
				401: ErrorSchema,
				500: ErrorSchema,
			},
		},
		async handler(request, reply) {
			try {
				const session = await auth.api.getSession({
					headers: fromNodeHeaders(request.headers),
				});

				if (!session) {
					throw new UnauthorizedError("Unauthorized");
				}

				const getWorkoutPlans = new GetWorkoutPlans();
				const result = await getWorkoutPlans.execute({
					userId: session.user.id,
					active: request.query.active,
				});

				return reply.status(200).send(result);
			} catch (error) {
				app.log.error(error);
				return sendError(reply, error);
			}
		},
	});

	app.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: "/workout-plans",
		schema: {
			operationId: "createWorkoutPlan",
			tags: ["Workout Plan"],
			summary: "Create a new workout plan",
			body: WorkoutPlanSchema.omit({ id: true }),
			response: {
				201: WorkoutPlanSchema,
				400: ErrorSchema,
				401: ErrorSchema,
				404: ErrorSchema,
				500: ErrorSchema,
			},
		},
		async handler(request, reply) {
			try {
				const session = await auth.api.getSession({
					headers: fromNodeHeaders(request.headers),
				});
				if (!session) {
					throw new UnauthorizedError("Unauthorized");
				}
				const createWorkoutPlan = new CreateWorkoutPlan();
				const result = await createWorkoutPlan.execute({
					userId: session.user.id,
					name: request.body.name,
					workoutDays: request.body.workoutDays,
				});
				return reply.status(201).send(result);
			} catch (error) {
				app.log.error(error);
				return sendError(reply, error);
			}
		},
	});

	app.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/workout-plans/:workoutPlanId/days/:workoutDayId",
		schema: {
			operationId: "getWorkoutDay",
			tags: ["Workout Plan"],
			summary: "Get a workout day with exercises and sessions",
			params: GetWorkoutDayParamsSchema,
			response: {
				200: GetWorkoutDayResponseSchema,
				401: ErrorSchema,
				403: ErrorSchema,
				404: ErrorSchema,
				500: ErrorSchema,
			},
		},
		async handler(request, reply) {
			try {
				const session = await auth.api.getSession({
					headers: fromNodeHeaders(request.headers),
				});

				if (!session) {
					throw new UnauthorizedError("Unauthorized");
				}

				const getWorkoutDay = new GetWorkoutDay();
				const result = await getWorkoutDay.execute({
					userId: session.user.id,
					workoutPlanId: request.params.workoutPlanId,
					workoutDayId: request.params.workoutDayId,
				});

				return reply.status(200).send(result);
			} catch (error) {
				app.log.error(error);

				return sendError(reply, error);
			}
		},
	});

	app.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/workout-plans/:id",
		schema: {
			operationId: "getWorkoutPlanWithoutExercises",
			tags: ["Workout Plan"],
			summary: "Get a workout plan without exercises",
			params: GetWorkoutPlanParamsSchema,
			response: {
				200: GetWorkoutPlanResponseSchema,
				401: ErrorSchema,
				403: ErrorSchema,
				404: ErrorSchema,
				500: ErrorSchema,
			},
		},
		async handler(request, reply) {
			try {
				const session = await auth.api.getSession({
					headers: fromNodeHeaders(request.headers),
				});

				if (!session) {
					throw new UnauthorizedError("Unauthorized");
				}

				const getWorkoutPlan = new GetWorkoutPlan();
				const result = await getWorkoutPlan.execute({
					userId: session.user.id,
					id: request.params.id,
				});

				return reply.status(200).send(result);
			} catch (error) {
				app.log.error(error);

				return sendError(reply, error);
			}
		},
	});

	app.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: "/workout-plans/:workoutPlanId/days/:workoutDayId/sessions",
		schema: {
			operationId: "startWorkoutSession",
			tags: ["Workout Plan"],
			summary: "Start a workout session for a specific workout day",
			body: StartWorkoutSessionBodySchema,
			querystring: StartWorkoutSessionQuerySchema,
			params: StartWorkoutSessionParamsSchema,
			response: {
				201: StartWorkoutSessionResponseSchema,
				400: ErrorSchema,
				401: ErrorSchema,
				403: ErrorSchema,
				404: ErrorSchema,
				409: ErrorSchema,
				500: ErrorSchema,
			},
		},
		async handler(request, reply) {
			try {
				const session = await auth.api.getSession({
					headers: fromNodeHeaders(request.headers),
				});

				if (!session) {
					throw new UnauthorizedError("Unauthorized");
				}

				const startWorkoutSession = new StartWorkoutSession();
				const result = await startWorkoutSession.execute({
					userId: session.user.id,
					workoutPlanId: request.params.workoutPlanId,
					workoutDayId: request.params.workoutDayId,
				});

				return reply.status(201).send(result);
			} catch (error) {
				app.log.error(error);

				return sendError(reply, error);
			}
		},
	});

	app.withTypeProvider<ZodTypeProvider>().route({
		method: "PATCH",
		url: "/workout-plans/:workoutPlanId/days/:workoutDayId/sessions/:workoutSessionId",
		schema: {
			operationId: "updateWorkoutSession",
			tags: ["Workout Plan"],
			summary: "Update a specific workout session",
			body: UpdateWorkoutSessionBodySchema,
			querystring: UpdateWorkoutSessionQuerySchema,
			params: UpdateWorkoutSessionParamsSchema,
			response: {
				200: UpdateWorkoutSessionResponseSchema,
				400: ErrorSchema,
				401: ErrorSchema,
				403: ErrorSchema,
				404: ErrorSchema,
				500: ErrorSchema,
			},
		},
		async handler(request, reply) {
			try {
				const session = await auth.api.getSession({
					headers: fromNodeHeaders(request.headers),
				});

				if (!session) {
					throw new UnauthorizedError("Unauthorized");
				}

				const updateWorkoutSession = new UpdateWorkoutSession();
				const result = await updateWorkoutSession.execute({
					userId: session.user.id,
					workoutPlanId: request.params.workoutPlanId,
					workoutDayId: request.params.workoutDayId,
					workoutSessionId: request.params.workoutSessionId,
					completedAt: request.body.completedAt,
				});

				return reply.status(200).send(result);
			} catch (error) {
				app.log.error(error);

				return sendError(reply, error);
			}
		},
	});
};
