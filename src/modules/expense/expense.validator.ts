import { z } from "zod";

export const createExpenseSchema = z.object({
    isRecurring: z.boolean().default(false),
    category: z.object({
        name: z.string().min(1),
        type: z.string().min(1),
        description: z.string().optional(),
    }),
    stream: z.object({
        startDate: z.string().transform((val) => new Date(val)),
        endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "ONE_TIME"]),
        baseAmount: z.number().positive(),
        currency: z.string().min(1),
    }),
    entry: z.object({
        date: z.string().transform((val) => new Date(val)),
        amount: z.number().positive(),
        note: z.string().optional(),
    }),
});

export const updateExpenseSchema = z.object({
    isRecurring: z.boolean().optional(),
    category: z.object({
        id: z.string().optional(),
        name: z.string().min(1).optional(),
        type: z.string().min(1).optional(),
        description: z.string().optional(),
    }).optional(),
    stream: z.object({
        id: z.string().optional(),
        startDate: z.string().transform((val) => new Date(val)).optional(),
        endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined).optional(),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "ONE_TIME"]).optional(),
        baseAmount: z.number().positive().optional(),
        currency: z.string().min(1).optional(),
    }).optional(),
    entry: z.object({
        id: z.string().optional(),
        date: z.string().transform((val) => new Date(val)).optional(),
        amount: z.number().positive().optional(),
        note: z.string().optional(),
    }).optional(),
});
