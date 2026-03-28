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
        const { source, stream, entry } = dto;
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
            source: {
                ...source,
                organizationId: user.organizationId!,
                userId: user.id,
                createdBy: user.id,
            },

            stream: {
                ...stream,
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

        const isFutureStream = !mergedStream.endDate || mergedStream.endDate > today;
        const upToDate = isFutureStream ? today : undefined;

        const newEntryDates = generateEntryDates(
            mergedStream.startDate,
            mergedStream.endDate,
            mergedStream.frequency,
            upToDate
        );

        const existingEntries = existingStream.entries;
        const existingDatesMap = new Map(
            existingEntries.map((e) => [e.date.getTime(), e])
        );

        const entriesToCreate: IncomeEntryData[] = [];
        const deleteEntryIds: string[] = [];

        // Check which new dates need new entries
        newEntryDates.forEach((date) => {
            const existingEntry = existingDatesMap.get(date.getTime());
            if (!existingEntry) {
                entriesToCreate.push({
                    date,
                    estimatedAmount: mergedStream.baseAmount,
                    actualAmount: date.getTime() === updatedEntryDto.date?.getTime() ? updatedEntryDto.actualAmount : null,
                    note: date.getTime() === updatedEntryDto.date?.getTime() ? updatedEntryDto.note : null,
                    organizationId: user.organizationId!,
                    createdBy: user.id,
                });
            }
        });

        // Determine which existing entries to delete
        // Delete only those that are NOT in the new schedule AND are still PENDING without actualAmount
        const newDatesSet = new Set(newEntryDates.map((d) => d.getTime()));
        existingEntries.forEach((e) => {
            if (!newDatesSet.has(e.date.getTime()) && e.status === "PENDING" && e.actualAmount === null) {
                deleteEntryIds.push(e.id);
            }
        });

        const payload: IncomeUpdatePayload = {
            source: updatedSource,
            stream: updatedStreamDto,
            entries: entriesToCreate,
            deleteEntryIds,
        };

        return IncomeRepository.updateFullIncome(id, payload);
    },
};