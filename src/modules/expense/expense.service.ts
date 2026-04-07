import { AuthUser } from "../../common/types/common.types";
import {
    CreateExpenseRequestDto,
    UpdateExpenseRequestDto,
    ExpenseCreatePayload,
    ExpenseUpdatePayload,
    ExpenseEntryData
} from "./expense.types";
import { ExpenseRepository } from "./expense.repository";
import { generateEntryDates } from "../../common/utils/entry-generator";

export const ExpenseService = {
    async create(
        dto: CreateExpenseRequestDto,
        user: AuthUser
    ) {
        const { category, stream, entry, isRecurring } = dto;
        const today = new Date();

        const isFutureStream = !stream.endDate || stream.endDate > today;
        const upToDate = isFutureStream ? today : undefined;

        const entryDates = generateEntryDates(
            stream.startDate,
            stream.endDate,
            stream.frequency,
            upToDate
        );

        const payload: ExpenseCreatePayload = {
            isRecurring,
            category: {
                ...category,
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
                amount: date.getTime() === entry.date.getTime() ? entry.amount : stream.baseAmount,
                note: date.getTime() === entry.date.getTime() ? entry.note : null,
                organizationId: user.organizationId!,
                createdBy: user.id,
            })),
        };
        console.log(payload);

        return ExpenseRepository.createFullExpense(payload);
    },

    async getAll(user: AuthUser) {
        return ExpenseRepository.getAll(user.organizationId!);
    },

    async getById(id: string, user: AuthUser) {
        const data = await ExpenseRepository.getById(id, user.organizationId!);
        if (!data) throw new Error("Expense not found");
        return data;
    },

    async delete(id: string, user: AuthUser) {
        return ExpenseRepository.delete(id, user.id);
    },

    async update(id: string, dto: UpdateExpenseRequestDto, user: AuthUser) {
        const existingExpense = await ExpenseRepository.getById(id, user.organizationId!);
        if (!existingExpense) throw new Error("Expense not found");

        const existingStream = existingExpense.streams[0];
        if (!existingStream) throw new Error("Expense stream not found");

        const existingEntries = existingStream.entries;
        const today = new Date();
        const updatedCategory = dto.category || {};
        const updatedStreamDto = dto.stream || {};
        const updatedEntryDto: any = dto.entry || {};

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

        const entriesToCreate: ExpenseEntryData[] = [];
        const deleteEntryIds: string[] = [];
        let entryToUpdate: any = null;

        if (updatedEntryDto.id) {
            entryToUpdate = {
                id: updatedEntryDto.id,
                date: updatedEntryDto.date ? new Date(updatedEntryDto.date) : undefined,
                amount: updatedEntryDto.amount !== undefined ? updatedEntryDto.amount : undefined,
                note: updatedEntryDto.note !== undefined ? updatedEntryDto.note : undefined,
            };
        }

        newEntryDates.forEach((date) => {
            const existingEntry = existingDatesMap.get(date.getTime());

            if (!existingEntry && (!entryToUpdate || date.getTime() !== entryToUpdate.date?.getTime())) {
                entriesToCreate.push({
                    date,
                    amount: mergedStream.baseAmount,
                    note: null,
                    organizationId: user.organizationId!,
                    createdBy: user.id,
                });
            }
        });

        const newDatesSet = new Set(newEntryDates.map((d) => d.getTime()));
        existingEntries.forEach((e) => {
            const isTargetOfUpdate = entryToUpdate && e.id === entryToUpdate.id;
            if (!isTargetOfUpdate && !newDatesSet.has(e.date.getTime()) && e.status === "PENDING") {
                deleteEntryIds.push(e.id);
            }
        });

        const payload: ExpenseUpdatePayload = {
            isRecurring,
            category: updatedCategory,
            stream: {
                ...updatedStreamDto,
                isRecurring,
            },
            entries: entriesToCreate,
            entryToUpdate: entryToUpdate || undefined,
            deleteEntryIds,
        };

        return ExpenseRepository.updateFullExpense(id, payload);
    },

    async syncStreamEntries(streamId: string, upToDate: Date = new Date()) {
        const stream = await ExpenseRepository.getStreamWithLastEntry(streamId);

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
                amount: stream.baseAmount,
                status: "PENDING",
                createdBy: stream.createdBy,
            }));

            await ExpenseRepository.createPendingEntries(newEntries);
        }
    }
};
