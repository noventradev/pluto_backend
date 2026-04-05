import { Prisma } from "@prisma/client";
import prisma from "database/prisma.client";

export const DealRepository = {
    async createDeal(data: Prisma.DealCreateInput) {
        return prisma.$transaction(async (tx) => {
            const deal = await tx.deal.create({
                data
            })
            return { deal }
        })
    }
}