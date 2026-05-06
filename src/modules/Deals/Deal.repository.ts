import { Prisma } from "@prisma/client";
import prisma from "database/prisma.client";
import { generatePaymentSchedule } from "./Deal.payment.schedular";

type CreateDealInput = Prisma.DealUncheckedCreateInput & {
    split?: {
        parentDealId: string
        participantId: string
        amount: string
        label?: string
    }
}

interface SplitPayload {
    participantId: string
    agreedValue: number
    cycleAmount?: number | null
    label: string
}

export const DealRepository = {
    async createDeal(data: CreateDealInput) {
        const { ...dealData } = data;

        return prisma.$transaction(async (tx) => {

            const createdBy = dealData.createdBy ?? process.env.SUPER_ADMIN_ID; if (!createdBy) {
                throw new Error(
                    "createdBy is required or SUPER_ADMIN_ID must be set"
                );
            }
            // 1. create deal
            const deal = await tx.deal.create({
                data: dealData
            })
            // 2. generate + insert payments
            const schedule = generatePaymentSchedule(
                deal.id,
                deal.currency,
                Number(deal.agreedValue),
                deal.isRecurring,
                deal.cycleAmount !== null ? Number(deal.cycleAmount) : null,
                deal.recurrenceInterval,
                deal.startDate,
                deal.endDate,
                deal.nextPaymentDate,
                createdBy,
            )
            await tx.payment.createMany({ data: schedule })

            return { deal, payments: schedule }
        })
    },
    getAll(userId: string) {
        return prisma.deal.findMany({
            where: {
                userOwnerId: userId,
            },
            include: {
                payments: true,
                splits: true,
            }
        })
    },
    getById(id: string) {
        return prisma.deal.findUnique({
            where: {
                id: id,
            },
            include: {
                payments: true,
                splits: true,
                children: {
                    include: {
                        payments: true,
                    }
                }
            }
        })
    },
    createSplit(parentDealId: string, splitPayload: SplitPayload) {
        const createdBy = process.env.SUPER_ADMIN_ID;

        // console.log("parentDealId", parentDealId);
        return prisma.$transaction(async (tx) => {
            const deal = await tx.deal.findUnique({
                where: {
                    id: parentDealId,
                },
            })
            if (!deal) {
                throw new Error("Deal not found");
            }

            //2. Checker
            const existingSplits = await tx.dealSplit.findMany({
                where: { parentDealId: deal.id }
            })

            const totalSplitAmount = existingSplits.reduce(
                (sum, split) => sum + Number(split.agreedValue),
                0
            ) + Number(splitPayload.agreedValue)

            if (totalSplitAmount > Number(deal.agreedValue)) {
                throw new Error(
                    `Total split amount (${totalSplitAmount}) exceeds parent deal value (${deal.agreedValue})`
                )
            }

            // 3. Validate: For recurring, check cycleAmount
            if (deal.isRecurring) {
                if (!splitPayload.cycleAmount) {
                    throw new Error("cycleAmount required for recurring deal split")
                }

                const totalCycleSplit = existingSplits.reduce(
                    (sum, split) => sum + Number(split.cycleAmount || 0),
                    0
                ) + Number(splitPayload.cycleAmount)

                if (deal.cycleAmount && totalCycleSplit > Number(deal.cycleAmount)) {
                    throw new Error(
                        `Total cycle split (${totalCycleSplit}) exceeds parent cycle amount (${deal.cycleAmount})`
                    )
                }
            }

            // 4. Create Child Deal
            const createChildDeal = await tx.deal.create({
                data: {
                    title: `${deal.title} - ${splitPayload.label}`,
                    dealType: deal.dealType,
                    status: deal.status,

                    userOwnerId: createdBy,
                    orgOwnerId: null,

                    counterPartyName: deal.counterPartyName,
                    counterPartyEmail: deal.counterPartyEmail,
                    counterPartyType: deal.counterPartyType,
                    counterPartyContactPhone: deal.counterPartyContactPhone,

                    parentDealId: deal.id,
                    currency: deal.currency,
                    agreedValue: splitPayload.agreedValue,
                    cycleAmount: splitPayload.cycleAmount,

                    isRecurring: deal.isRecurring,
                    recurrenceInterval: deal.recurrenceInterval,
                    nextPaymentDate: deal.nextPaymentDate,

                    startDate: deal.startDate,
                    endDate: deal.endDate,
                    notes: deal.notes,
                    createdBy: createdBy,
                }
            })
            if (createChildDeal.isRecurring) {
                const schedule = generatePaymentSchedule(
                    createChildDeal.id,
                    createChildDeal.currency,
                    Number(createChildDeal.agreedValue),
                    createChildDeal.isRecurring,
                    createChildDeal.cycleAmount !== null ? Number(createChildDeal.cycleAmount) : null,
                    createChildDeal.recurrenceInterval,
                    createChildDeal.startDate,
                    createChildDeal.endDate,
                    createChildDeal.nextPaymentDate,
                    createChildDeal.createdBy!,
                )
                await tx.payment.createMany({ data: schedule })
            } else {
                await tx.payment.create({
                    data: {
                        dealId: createChildDeal.id,
                        amount: createChildDeal.agreedValue,
                        currency: createChildDeal.currency,
                        dueDate: createChildDeal.nextPaymentDate || createChildDeal.startDate,
                        status: 'PENDING',
                        createdBy: createChildDeal.createdBy
                    }
                })
            }

            // 5. Create Split Record
            const createSplit = await tx.dealSplit.create({
                data: {
                    parentDealId: deal.id,
                    childDealId: createChildDeal.id,
                    participantId: createdBy!,
                    label: splitPayload.label,
                    agreedValue: splitPayload.agreedValue,
                    cycleAmount: splitPayload.cycleAmount,
                    createdBy: deal.createdBy,
                }
            })
            return { childDeal: createChildDeal, split: createSplit }
        })
    },
    getSplits(parentDealId: string) {
        return prisma.dealSplit.findMany({
            where: {
                parentDealId: parentDealId,
            },
        })
    }
}
