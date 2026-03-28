import { z } from "zod";

export const createIncomeSchema = z.object({
    source: z.object({
        sourceOfIncome: z.string(),
        name: z.string(),
        type: z.enum(["ONE_TIME", "RECURRING", "CONTRACT"]),
    }),
    stream: z.object({
        startDate: z.string().transform((val) => new Date(val)),
        endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "ONE_TIME"]),
        baseAmount: z.number(),
        currency: z.enum(["INR", "USD", "GBP"]),
    }),
    entry: z.object({
        date: z.string().transform((val) => new Date(val)),
        actualAmount: z.number().optional(),
        note: z.string().optional(),
    }),
});

export const updateIncomeSchema = z.object({
    source: z.object({
        sourceOfIncome: z.string().optional(),
        name: z.string().optional(),
        type: z.enum(["ONE_TIME", "RECURRING", "CONTRACT"]).optional(),
    }).optional(),
    stream: z.object({
        startDate: z.string().transform((val) => new Date(val)).optional(),
        endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined).optional(),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "ONE_TIME"]).optional(),
        baseAmount: z.number().optional(),
        currency: z.enum(["INR", "USD", "GBP"]).optional(),
    }).optional(),
    entry: z.object({
        date: z.string().transform((val) => new Date(val)).optional(),
        actualAmount: z.number().optional(),
        note: z.string().optional(),
    }).optional(),
});