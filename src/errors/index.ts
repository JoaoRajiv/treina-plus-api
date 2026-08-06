import type { FastifyReply } from "fastify";

export const ERROR_CODES = [
	"UNAUTHORIZED",
	"FORBIDDEN",
	"NOT_FOUND",
	"CONFLICT",
	"WORKOUT_PLAN_NOT_ACTIVE",
	"WORKOUT_SESSION_ALREADY_STARTED",
	"VALIDATION_ERROR",
	"INTERNAL_SERVER_ERROR",
	"AUTH_FAILURE",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];
export type HttpStatusCode = 400 | 401 | 403 | 404 | 409 | 500;

interface ErrorResponse {
	statusCode: HttpStatusCode;
	body: { error: string; code: ErrorCode };
}

export abstract class AppError extends Error {
	abstract readonly statusCode: HttpStatusCode;
	abstract readonly code: ErrorCode;

	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = new.target.name;
	}
}

export class UnauthorizedError extends AppError {
	readonly statusCode = 401;
	readonly code = "UNAUTHORIZED";
}

export class ForbiddenError extends AppError {
	readonly statusCode = 403;
	readonly code = "FORBIDDEN";
}

export class NotFoundError extends AppError {
	readonly statusCode = 404;
	readonly code = "NOT_FOUND";
}

export class ConflictError extends AppError {
	readonly statusCode = 409;
	readonly code: ErrorCode = "CONFLICT";
}

export class WorkoutPlanNotActiveError extends ConflictError {
	readonly code = "WORKOUT_PLAN_NOT_ACTIVE";
}

export class WorkoutSessionAlreadyStartedError extends ConflictError {
	readonly code = "WORKOUT_SESSION_ALREADY_STARTED";
}

export function getErrorResponse(error: unknown): ErrorResponse {
	if (error instanceof AppError) {
		return {
			statusCode: error.statusCode,
			body: { error: error.message, code: error.code },
		};
	}

	if (typeof error === "object" && error !== null && "validation" in error) {
		return {
			statusCode: 400,
			body: {
				error: "Request validation failed",
				code: "VALIDATION_ERROR" as const,
			},
		};
	}

	return {
		statusCode: 500,
		body: {
			error: "Internal server error",
			code: "INTERNAL_SERVER_ERROR" as const,
		},
	};
}

export function sendError(reply: FastifyReply, error: unknown) {
	const response = getErrorResponse(error);
	reply.raw.statusCode = response.statusCode;
	return reply.send(response.body);
}
