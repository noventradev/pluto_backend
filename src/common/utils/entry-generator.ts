import { Frequency } from "@prisma/client";

export const generateEntryDates = (
    startDate: Date,
    endDate: Date | null | undefined,
    frequency: Frequency,
    upToDate?: Date
): Date[] => {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    const limit = upToDate ? new Date(upToDate) : null;

    // Helper to add frequency step
    const addStep = (date: Date): Date => {
        const next = new Date(date);
        switch (frequency) {
            case Frequency.DAILY:
                next.setDate(next.getDate() + 1);
                break;
            case Frequency.WEEKLY:
                next.setDate(next.getDate() + 7);
                break;
            case Frequency.MONTHLY:
                next.setDate(next.getMonth() + 1);
                break;
            case Frequency.YEARLY:
                next.setFullYear(next.getFullYear() + 1);
                break;
            case Frequency.ONE_TIME:
                return next;
        }
        return next;
    };

    // If ONE_TIME, just return startDate if it's within limits
    if (frequency === Frequency.ONE_TIME) {
        if ((!end || currentDate <= end) && (!limit || currentDate <= limit)) {
            dates.push(new Date(currentDate));
        }
        return dates;
    }

    // Safety break to prevent infinite loops if frequency logic is broken
    let iterations = 0;
    const MAX_ITERATIONS = 1000;

    while (iterations < MAX_ITERATIONS) {
        // Check if currentDate exceeds overall endDate
        if (end && currentDate > end) break;

        // Check if currentDate exceeds upToDate limit
        if (limit && currentDate > limit) break;

        dates.push(new Date(currentDate));

        const nextDate = addStep(currentDate);

        // If the date didn't change (shouldn't happen with valid frequencies), break
        if (nextDate.getTime() === currentDate.getTime()) break;

        currentDate = nextDate;
        iterations++;
    }

    return dates;
};
