import { prisma } from "../lib/db.js";

interface InputDto {
	userId: string;
	weightInGrams: number;
	heightInCentimeters: number;
	age: number;
	bodyFatPercentage: number; // Integer percentage: 25 means 25%.
}

interface OutputDto {
	userId: string;
	weightInGrams: number;
	heightInCentimeters: number;
	age: number;
	bodyFatPercentage: number;
}

export class UpsertUserTrainData {
	async execute(dto: InputDto): Promise<OutputDto> {
		const user = await prisma.user.update({
			where: { id: dto.userId },
			data: {
				weightInGrams: dto.weightInGrams,
				heightInCentimeters: dto.heightInCentimeters,
				age: dto.age,
				bodyFatPercentage: dto.bodyFatPercentage,
			},
			select: {
				id: true,
				weightInGrams: true,
				heightInCentimeters: true,
				age: true,
				bodyFatPercentage: true,
			},
		});

		if (
			user.weightInGrams === null ||
			user.heightInCentimeters === null ||
			user.age === null ||
			user.bodyFatPercentage === null
		) {
			throw new Error("User training data was not updated");
		}

		return {
			userId: user.id,
			weightInGrams: user.weightInGrams,
			heightInCentimeters: user.heightInCentimeters,
			age: user.age,
			bodyFatPercentage: user.bodyFatPercentage,
		};
	}
}
