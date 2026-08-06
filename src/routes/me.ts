import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { sendError, UnauthorizedError } from "../errors/index.js";
import { auth } from "../lib/auth.js";
import {
	ErrorSchema,
	GetUserTrainDataResponseSchema,
	UpsertUserTrainDataBodySchema,
	UpsertUserTrainDataResponseSchema,
} from "../schemas/index.js";
import { GetUserTrainData } from "../usecases/GetUserTrainData.js";
import { UpsertUserTrainData } from "../usecases/UpsertUserTrainData.js";

export const meRoutes = async (app: FastifyInstance) => {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "",
		schema: {
			tags: ["User"],
			summary: "Get authenticated user's training data",
			response: {
				200: GetUserTrainDataResponseSchema,
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

				const getUserTrainData = new GetUserTrainData();
				const result = await getUserTrainData.execute({
					userId: session.user.id,
				});

				return reply.status(200).send(result);
			} catch (error) {
				app.log.error({ err: error }, "Failed to get user training data");
				return sendError(reply, error);
			}
		},
	});

	app.withTypeProvider<ZodTypeProvider>().route({
		method: "PUT",
		url: "",
		schema: {
			tags: ["User"],
			summary: "Create or update authenticated user's training data",
			body: UpsertUserTrainDataBodySchema,
			response: {
				200: UpsertUserTrainDataResponseSchema,
				400: ErrorSchema,
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

				const upsertUserTrainData = new UpsertUserTrainData();
				const result = await upsertUserTrainData.execute({
					userId: session.user.id,
					...request.body,
				});

				return reply.status(200).send(result);
			} catch (error) {
				app.log.error({ err: error }, "Failed to update user training data");
				return sendError(reply, error);
			}
		},
	});
};
