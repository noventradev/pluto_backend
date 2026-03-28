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
                source = await tx.incomeSource.update({
                    where: { id },
                    data: data.source,
                });
            } else {
                source = await tx.incomeSource.findUnique({ where: { id } });
            }

            let stream;
            if (data.stream) {
                stream = await tx.incomeStream.updateMany({
                    where: { sourceId: id },
                    data: data.stream,
                });
                stream = await tx.incomeStream.findFirst({ where: { sourceId: id } });
            }

            if (!stream) throw new Error("Stream not found");

            // Entries update logic should ideally be here if it's large,
            // but we'll call separate methods for clarity if needed.
            // For now, let's keep it simple.
            if (data.entries) {
                // Remove pending entries that are no longer part of the schedule
                // (This is determined by the service and passed here)
                if (data.deleteEntryIds && data.deleteEntryIds.length > 0) {
                    await tx.incomeEntry.deleteMany({
                        where: { id: { in: data.deleteEntryIds } },
                    });
                }

                if (data.entries.length > 0) {
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
                ]
            },
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