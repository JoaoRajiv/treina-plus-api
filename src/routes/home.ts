import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { sendError, UnauthorizedError } from "../errors/index.js";
import { auth } from "../lib/auth.js";
import {
	ErrorSchema,
	HomeParamsSchema,
	HomeResponseSchema,
} from "../schemas/index.js";
import { GetHomeData } from "../usecases/GetHomeData.js";

export const homeRoutes = async (app: FastifyInstance) => {
	app.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/home/:date",
		schema: {
			tags: ["Home"],
			summary: "Get the authenticated user's home data",
			params: HomeParamsSchema,
			response: {
				200: HomeResponseSchema,
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

				const getHome = new GetHomeData();
				const result = await getHome.execute({
					userId: session.user.id,
					date: request.params.date,
				});

				return reply.status(200).send(result);
			} catch (error) {
				app.log.error(error);

				return sendError(reply, error);
			}
		},
	});
};
