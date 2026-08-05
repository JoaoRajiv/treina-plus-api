import { ForbiddenError, NotFoundError } from "../errors/index.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
  workoutSessionId: string;
  completedAt: string;
}

interface OutputDto {
  id: string;
  startedAt: string;
  completedAt: string;
}

export class UpdateWorkoutSession {
  async execute(dto: InputDto): Promise<OutputDto> {
    return prisma.$transaction(async (tx) => {
      const workoutPlan = await tx.workoutPlan.findUnique({
        where: { id: dto.workoutPlanId },
        select: {
          id: true,
          userId: true,
        },
      });

      if (!workoutPlan) {
        throw new NotFoundError("Workout plan not found");
      }

      if (workoutPlan.userId !== dto.userId) {
        throw new ForbiddenError("You do not have access to this workout plan");
      }

      const workoutDay = await tx.workoutDay.findUnique({
        where: { id: dto.workoutDayId },
        select: {
          id: true,
          workoutPlanId: true,
        },
      });

      if (!workoutDay || workoutDay.workoutPlanId !== dto.workoutPlanId) {
        throw new NotFoundError("Workout day not found");
      }

      const workoutSession = await tx.workoutSession.findUnique({
        where: { id: dto.workoutSessionId },
        select: {
          id: true,
          workoutDayId: true,
          startedAt: true,
        },
      });

      if (!workoutSession || workoutSession.workoutDayId !== dto.workoutDayId) {
        throw new NotFoundError("Workout session not found");
      }

      const updatedSession = await tx.workoutSession.update({
        where: { id: dto.workoutSessionId },
        data: {
          completedAt: new Date(dto.completedAt),
        },
        select: {
          id: true,
          startedAt: true,
          completedAt: true,
        },
      });

      if (!updatedSession.completedAt) {
        throw new NotFoundError("Workout session not found");
      }

      return {
        id: updatedSession.id,
        startedAt: updatedSession.startedAt.toISOString(),
        completedAt: updatedSession.completedAt.toISOString(),
      };
    });
  }
}
