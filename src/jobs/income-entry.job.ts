import cron from "node-cron";
import { IncomeRepository } from "../modules/Income/Income.repository";
import { generateEntryDates } from "../common/utils/entry-generator";
import { Frequency } from "@prisma/client";

export const initIncomeEntryJob = () => {
    // Run at midnight every day
    cron.schedule("0 0 * * *", async () => {
        console.log("⏰ Running Income Entry Generation Job...");
        
        try {
            const activeStreams = await IncomeRepository.getActiveStreamsForEntryGeneration();
            const today = new Date();
            
            for (const stream of activeStreams) {
                const lastEntry = stream.entries[0];
                const lastDate = lastEntry ? new Date(lastEntry.date) : new Date(stream.startDate);
                
                // We want to generate entries starting from the next scheduled date
                const nextStartDate = new Date(lastDate);
                
                // If it's the very first entry, we start at startDate. 
                // If we already have entries, we start at the next interval.
                if (lastEntry) {
                    switch (stream.frequency) {
                        case Frequency.DAILY: nextStartDate.setDate(nextStartDate.getDate() + 1); break;
                        case Frequency.WEEKLY: nextStartDate.setDate(nextStartDate.getDate() + 7); break;
                        case Frequency.MONTHLY: nextStartDate.setMonth(nextStartDate.getMonth() + 1); break;
                        case Frequency.YEARLY: nextStartDate.setFullYear(nextStartDate.getFullYear() + 1); break;
                        case Frequency.ONE_TIME: continue; // Should not happen for recurring logic
                    }
                }

                // If nextStartDate is already in the future, skip
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
                        estimatedAmount: stream.baseAmount,
                        actualAmount: null,
                        status: "PENDING",
                        createdBy: stream.createdBy,
                    }));

                    await IncomeRepository.createPendingEntries(newEntries);
                    console.log(`✅ Generated ${newEntries.length} entries for stream ${stream.id}`);
                }
            }
        } catch (error) {
            console.error("❌ Error in Income Entry Generation Job:", error);
        }
    });
};
