import { AuthUser } from "../../common/types/common.types";
import {
    CreateIncomeRequestDto,
    UpdateIncomeRequestDto,
    IncomeCreatePayload,
    IncomeUpdatePayload,
    IncomeEntryData
} from "./Income.types";
import { IncomeRepository } from "./Income.repository";
import { generateEntryDates } from "../../common/utils/entry-generator";

export const IncomeService = {
    async create(
        dto: CreateIncomeRequestDto,
        user: AuthUser
    ) {
        const { source, stream, entry, isRecurring } = dto;
        const today = new Date();

        // If endDate is in the future or null, we only generate entries up to today.
        // If endDate is in the past, we generate all entries for the entire stream.
        const isFutureStream = !stream.endDate || stream.endDate > today;
        const upToDate = isFutureStream ? today : undefined;

        const entryDates = generateEntryDates(
            stream.startDate,
            stream.endDate,
            stream.frequency,
            upToDate
        );

        const payload: IncomeCreatePayload = {
            isRecurring,
            source: {
                ...source,
                organizationId: user.organizationId!,
                userId: user.id,
                createdBy: user.id,
            },

            stream: {
                ...stream,
                isRecurring,
                organizationId: user.organizationId!,
                createdBy: user.id,
            },

            entries: entryDates.map((date) => ({
                date,
                estimatedAmount: stream.baseAmount,
                actualAmount: date.getTime() === entry.date.getTime() ? entry.actualAmount : null,
                note: date.getTime() === entry.date.getTime() ? entry.note : null,
                organizationId: user.organizationId!,
                createdBy: user.id,
            })),
        };

        return IncomeRepository.createFullIncome(payload);
    },

    async getAll(user: AuthUser) {
        return IncomeRepository.getAll(user.organizationId!);
    },

    async getById(id: string, user: AuthUser) {
        const data = await IncomeRepository.getById(id, user.organizationId!);
        if (!data) throw new Error("Income not found");
        return data;
    },

    async delete(id: string, user: AuthUser) {
        return IncomeRepository.delete(id, user.id);
    },

    async update(id: string, dto: UpdateIncomeRequestDto, user: AuthUser) {
        const existingIncome = await IncomeRepository.getById(id, user.organizationId!);
        if (!existingIncome) throw new Error("Income not found");

        const existingStream = existingIncome.streams[0]; // Assuming one stream for now
        if (!existingStream) throw new Error("Income stream not found");

        const existingEntries = existingStream.entries;
        const today = new Date();
        const updatedSource = dto.source || {};
        const updatedStreamDto = dto.stream || {};
        const updatedEntryDto: any = dto.entry || {};

        // Merge existing stream with updates to recalculate dates
        const mergedStream = {
            startDate: (updatedStreamDto as any).startDate || existingStream.startDate,
            endDate: (updatedStreamDto as any).endDate !== undefined ? (updatedStreamDto as any).endDate : existingStream.endDate,
            frequency: (updatedStreamDto as any).frequency || existingStream.frequency,
            baseAmount: (updatedStreamDto as any).baseAmount !== undefined ? (updatedStreamDto as any).baseAmount : existingStream.baseAmount,
        };

        const isRecurring = dto.isRecurring !== undefined ? dto.isRecurring : (existingStream as any).isRecurring;

        let newEntryDates: Date[] = [];
        if (isRecurring) {
            const isFutureStream = !mergedStream.endDate || mergedStream.endDate > today;
            const upToDate = isFutureStream ? today : undefined;

            newEntryDates = generateEntryDates(
                mergedStream.startDate,
                mergedStream.endDate,
                mergedStream.frequency,
                upToDate
            );
        } else {
            const singleDate = updatedEntryDto.date ? new Date(updatedEntryDto.date) : (existingEntries[0]?.date || mergedStream.startDate);
            newEntryDates = [new Date(singleDate)];
        }

        const existingDatesMap = new Map(
            existingEntries.map((e) => [e.date.getTime(), e])
        );

        const entriesToCreate: IncomeEntryData[] = [];
        const deleteEntryIds: string[] = [];
        let entryToUpdate: any = null;

        if (updatedEntryDto.id) {
            entryToUpdate = {
                id: updatedEntryDto.id,
                date: updatedEntryDto.date ? new Date(updatedEntryDto.date) : undefined,
                actualAmount: updatedEntryDto.actualAmount !== undefined ? updatedEntryDto.actualAmount : undefined,
                note: updatedEntryDto.note !== undefined ? updatedEntryDto.note : undefined,
            };
        }

        // Check which new dates need new entries
        newEntryDates.forEach((date) => {
            const existingEntry = existingDatesMap.get(date.getTime());

            // Skip entry creation if we are updating an existing one with an explicit ID
            // or if the date already has an entry.
            if (!existingEntry && (!entryToUpdate || date.getTime() !== entryToUpdate.date?.getTime())) {
                entriesToCreate.push({
                    date,
                    estimatedAmount: mergedStream.baseAmount,
                    actualAmount: null,
                    note: null,
                    organizationId: user.organizationId!,
                    createdBy: user.id,
                });
            }
        });

        const newDatesSet = new Set(newEntryDates.map((d) => d.getTime()));
        existingEntries.forEach((e) => {
            const isTargetOfUpdate = entryToUpdate && e.id === entryToUpdate.id;
            if (!isTargetOfUpdate && !newDatesSet.has(e.date.getTime()) && e.status === "PENDING" && e.actualAmount === null) {
                deleteEntryIds.push(e.id);
            }
        });

        const payload: IncomeUpdatePayload = {
            isRecurring,
            source: updatedSource,
            stream: {
                ...updatedStreamDto,
                isRecurring,
            },
            entries: entriesToCreate,
            entryToUpdate: entryToUpdate || undefined,
            deleteEntryIds,
        };

        return IncomeRepository.updateFullIncome(id, payload);
    },

    async syncStreamEntries(streamId: string, upToDate: Date = new Date()) {
        const stream = await IncomeRepository.getStreamWithLastEntry(streamId);

        if (!stream || !stream.isRecurring) return;

        const lastEntry = stream.entries[0];
        const lastDate = lastEntry ? new Date(lastEntry.date) : new Date(stream.startDate);

        let nextStartDate = new Date(lastDate);
        if (lastEntry) {
            switch (stream.frequency) {
                case "DAILY": nextStartDate.setDate(nextStartDate.getDate() + 1); break;
                case "WEEKLY": nextStartDate.setDate(nextStartDate.getDate() + 7); break;
                case "MONTHLY": nextStartDate.setMonth(nextStartDate.getMonth() + 1); break;
                case "YEARLY": nextStartDate.setFullYear(nextStartDate.getFullYear() + 1); break;
                case "ONE_TIME": return;
            }
        }

        if (nextStartDate > upToDate) return;

        const missingDates = generateEntryDates(
            nextStartDate,
            stream.endDate,
            stream.frequency,
            upToDate
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
        }
    }
};