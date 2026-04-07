import cron from "node-cron";
import { ExpenseRepository } from "../modules/expense/expense.repository";
import { generateEntryDates } from "../common/utils/entry-generator";
import { Frequency } from "@prisma/client";

export const initExpenseEntryJob = () => {
    cron.schedule("0 0 * * *", async () => {
        console.log("Running Expense Entry Generation Job...");

        try {
            const activeStreams = await ExpenseRepository.getActiveStreamsForEntryGeneration();
            const today = new Date();

            for (const stream of activeStreams) {
                const lastEntry = stream.entries[0];
                const lastDate = lastEntry ? new Date(lastEntry.date) : new Date(stream.startDate);

                const nextStartDate = new Date(lastDate);

                if (lastEntry) {
                    switch (stream.frequency) {
                        case Frequency.DAILY: nextStartDate.setDate(nextStartDate.getDate() + 1); break;
                        case Frequency.WEEKLY: nextStartDate.setDate(nextStartDate.getDate() + 7); break;
                        case Frequency.MONTHLY: nextStartDate.setMonth(nextStartDate.getMonth() + 1); break;
                        case Frequency.YEARLY: nextStartDate.setFullYear(nextStartDate.getFullYear() + 1); break;
                        case Frequency.ONE_TIME: continue;
                    }
                }

                if (nextStartDate > today) continue;

                const missingDates = generateEntryDates(
                    nextStartDate,
                    stream.endDate,
                    stream.frequency,
                    today
                );

                if (missingDates.length > 0) {
                    const newEntries = missingDates.map(date => ({
                        date,
                        streamId: stream.id,
                        organizationId: stream.organizationId,
                        amount: stream.baseAmount,
                        status: "PENDING",
                        createdBy: stream.createdBy,
                    }));

                    await ExpenseRepository.createPendingEntries(newEntries);
                    console.log(`Generated ${newEntries.length} expense entries for stream ${stream.id}`);
                }
            }
        } catch (error) {
            console.error("Error in Expense Entry Generation Job:", error);
        }
    });
};
