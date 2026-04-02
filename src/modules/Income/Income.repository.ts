import prisma from "@db/prisma.client";
import {
    IncomeCreatePayload,
    IncomeUpdatePayload,
    IncomeEntryData
} from "./Income.types";

export const IncomeRepository = {
    async createFullIncome(data: IncomeCreatePayload) {
        return prisma.$transaction(async (tx) => {
            const source = await tx.incomeSource.create({
                data: data.source,
            });

            const stream = await tx.incomeStream.create({
                data: {
                    ...data.stream,
                    sourceId: source.id,
                    isRecurring: data.isRecurring,
                },
            });

            const entries = await tx.incomeEntry.createMany({
                data: data.entries.map((e: any) => ({
                    ...e,
                    streamId: stream.id,
                })),
            });

            return { source, stream, entries };
        });
    },

    async updateFullIncome(id: string, data: IncomeUpdatePayload) {
        return prisma.$transaction(async (tx) => {
            let source;
            if (data.source) {
                const { id: sourceId, ...sourceUpdateData } = data.source;
                source = await tx.incomeSource.update({
                    where: { id: sourceId || id },
                    data: sourceUpdateData,
                });
            } else {
                source = await tx.incomeSource.findUnique({ where: { id } });
            }

            let stream;
            if (data.stream) {
                const { id: streamId, sourceId: __, ...streamUpdateData } = data.stream;
                if (streamId) {
                    await tx.incomeStream.update({
                        where: { id: streamId },
                        data: streamUpdateData,
                    });
                    stream = await tx.incomeStream.findUnique({ where: { id: streamId } });
                } else {
                    await tx.incomeStream.updateMany({
                        where: { sourceId: id },
                        data: streamUpdateData,
                    });
                    stream = await tx.incomeStream.findFirst({ where: { sourceId: id } });
                }
            }

            if (!stream) throw new Error("Stream not found");

            if (data.entries || data.entryToUpdate || data.deleteEntryIds) {
                // Remove pending entries that are no longer part of the schedule
                if (data.deleteEntryIds && data.deleteEntryIds.length > 0) {
                    await tx.incomeEntry.deleteMany({
                        where: { id: { in: data.deleteEntryIds } },
                    });
                }

                if (data.entryToUpdate) {
                    const { id, ...entryUpdateData } = data.entryToUpdate;
                    await tx.incomeEntry.update({
                        where: { id },
                        data: entryUpdateData,
                    });
                }

                // Create new entries
                if (data.entries && data.entries.length > 0) {
                    await tx.incomeEntry.createMany({
                        data: data.entries.map((e: any) => ({
                            ...e,
                            streamId: stream.id,
                        })),
                    });
                }

                // If baseAmount changed, update estimatedAmount for remaining PENDING entries
                if (data.stream?.baseAmount !== undefined) {
                    await tx.incomeEntry.updateMany({
                        where: {
                            streamId: stream.id,
                            status: "PENDING",
                            actualAmount: null,
                        },
                        data: {
                            estimatedAmount: data.stream.baseAmount,
                        },
                    });
                }
            }

            return { source, stream };
        });
    },

    getAll: (orgId: string) =>
        prisma.incomeSource.findMany({
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
        prisma.incomeSource.findFirst({
            where: { id, organizationId: orgId, isActive: true, deletedAt: null },
            include: {
                streams: {
                    include: { entries: true },
                },
            },
        }),

    delete: (id: string, userId: string) =>
        prisma.incomeSource.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                deletedBy: userId,
                isActive: false,
            },
        }),

    getActiveStreamsForEntryGeneration: () =>
        prisma.incomeStream.findMany({
            where: {
                isActive: true,
                deletedAt: null,
                OR: [
                    { endDate: null },
                    { endDate: { gte: new Date() } }
                ],
                isRecurring: true
            },
            include: {
                entries: {
                    orderBy: { date: 'desc' },
                    take: 1
                }
            }
        }),

    getStreamWithLastEntry: (streamId: string) =>
        prisma.incomeStream.findUnique({
            where: { id: streamId },
            include: {
                entries: {
                    orderBy: { date: 'desc' },
                    take: 1
                }
            }
        }),

    createPendingEntries: (data: any[]) =>
        prisma.incomeEntry.createMany({
            data
        }),
};