import type { Dayjs } from "dayjs";
import { WeekDay } from "../generated/prisma/enums.js";

const weekDays: WeekDay[] = [
	WeekDay.SUNDAY,
	WeekDay.MONDAY,
	WeekDay.TUESDAY,
	WeekDay.WEDNESDAY,
	WeekDay.THURSDAY,
	WeekDay.FRIDAY,
	WeekDay.SATURDAY,
];

export function getWeekDay(date: Dayjs): WeekDay {
	return weekDays[date.day()];
}

interface StreakInput {
	completedDates: ReadonlySet<string>;
	scheduledWeekDays: ReadonlySet<WeekDay>;
}

export function calculateWorkoutStreak(
	input: StreakInput & { from: Dayjs; to: Dayjs },
): number {
	let streak = 0;
	let date = input.from.startOf("day");
	const lastDate = input.to.startOf("day");

	while (!date.isAfter(lastDate)) {
		const dateKey = date.format("YYYY-MM-DD");
		const weekDay = getWeekDay(date);

		if (input.scheduledWeekDays.has(weekDay)) {
			streak = input.completedDates.has(dateKey) ? streak + 1 : 0;
		}

		date = date.add(1, "day");
	}

	return streak;
}

export function calculateCurrentWorkoutStreak(
	input: StreakInput & { date: Dayjs; earliestDate?: Dayjs },
): number {
	if (input.scheduledWeekDays.size === 0 || input.completedDates.size === 0) {
		return 0;
	}

	let streak = 0;
	let date = input.date.startOf("day");
	const earliestDate = input.earliestDate?.startOf("day");

	while (!earliestDate || !date.isBefore(earliestDate)) {
		const dateKey = date.format("YYYY-MM-DD");
		const weekDay = getWeekDay(date);

		if (input.scheduledWeekDays.has(weekDay)) {
			if (!input.completedDates.has(dateKey)) {
				break;
			}
			streak++;
		}

		date = date.subtract(1, "day");
	}

	return streak;
}
