import prisma from "@db/prisma.client";
import {
    ExpenseCreatePayload,
    ExpenseUpdatePayload,
} from "./expense.types";

export const ExpenseRepository = {
    async createFullExpense(data: ExpenseCreatePayload) {
        return prisma.$transaction(async (tx) => {
            const category = await tx.expenseCategory.create({
                data: data.category,
            });

            const stream = await tx.expenseStream.create({
                data: {
                    ...data.stream,
                    categoryId: category.id,
                },
            });

            const entries = await tx.expenseEntry.createMany({
                data: data.entries.map((e: any) => ({
                    ...e,
                    streamId: stream.id,
                })),
            });

            return { category, stream, entries };
        });
    },

    async updateFullExpense(id: string, data: ExpenseUpdatePayload) {
        return prisma.$transaction(async (tx) => {
            let category;
            if (data.category) {
                const { id: categoryId, ...categoryUpdateData } = data.category;
                category = await tx.expenseCategory.update({
                    where: { id: categoryId || id },
                    data: categoryUpdateData,
                });
            } else {
                category = await tx.expenseCategory.findUnique({ where: { id } });
            }

            let stream;
            if (data.stream) {
                const { id: streamId, categoryId: __, ...streamUpdateData } = data.stream;
                if (streamId) {
                    await tx.expenseStream.update({
                        where: { id: streamId },
                        data: streamUpdateData,
                    });
                    stream = await tx.expenseStream.findUnique({ where: { id: streamId } });
                } else {
                    await tx.expenseStream.updateMany({
                        where: { categoryId: id },
                        data: streamUpdateData,
                    });
                    stream = await tx.expenseStream.findFirst({ where: { categoryId: id } });
                }
            }

            if (!stream) throw new Error("Stream not found");

            if (data.entries || data.entryToUpdate || data.deleteEntryIds) {
                if (data.deleteEntryIds && data.deleteEntryIds.length > 0) {
                    await tx.expenseEntry.deleteMany({
                        where: { id: { in: data.deleteEntryIds } },
                    });
                }

                if (data.entryToUpdate) {
                    const { id, ...entryUpdateData } = data.entryToUpdate;
                    await tx.expenseEntry.update({
                        where: { id },
                        data: entryUpdateData,
                    });
                }

                if (data.entries && data.entries.length > 0) {
                    await tx.expenseEntry.createMany({
                        data: data.entries.map((e: any) => ({
                            ...e,
                            streamId: stream.id,
                        })),
                    });
                }

                if (data.stream?.baseAmount !== undefined) {
                    await tx.expenseEntry.updateMany({
                        where: {
                            streamId: stream.id,
                            status: "PENDING",
                        },
                        data: {
                            amount: data.stream.baseAmount,
                        },
                    });
                }
            }

            return { category, stream };
        });
    },

    getAll: (orgId: string) =>
        prisma.expenseCategory.findMany({
            where: { organizationId: orgId, deletedAt: null, isActive: true },
            include: {
                streams: {
                    include: {
                        entries: true,
                    },
                },
            },
        }),

    getById: (id: string, orgId: string) =>
        prisma.expenseCategory.findFirst({
            where: { id, organizationId: orgId, isActive: true, deletedAt: null },
            include: {
                streams: {
                    include: { entries: true },
                },
            },
        }),

    delete: (id: string, userId: string) =>
        prisma.expenseCategory.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                deletedBy: userId,
                isActive: false,
            },
        }),

    getActiveStreamsForEntryGeneration: () =>
        prisma.expenseStream.findMany({
            where: {
                isActive: true,
                isRecurring: true,
                deletedAt: null,
                OR: [
                    { endDate: null },
                    { endDate: { gte: new Date() } }
                ],
            },
            include: {
                entries: {
                    orderBy: { date: 'desc' },
                    take: 1
                }
            }
        }),

    getStreamWithLastEntry: (streamId: string) =>
        prisma.expenseStream.findUnique({
            where: { id: streamId },
            include: {
                entries: {
                    orderBy: { date: 'desc' },
                    take: 1
                }
            }
        }),

    createPendingEntries: (data: any[]) =>
        prisma.expenseEntry.createMany({
            data
        }),
};
