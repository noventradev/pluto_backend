import {
  CounterpartyType,
  Currency,
  DealStatus,
  DealType,
  RecurrenceInterval,
} from "@prisma/client";
import { z } from "zod";

// USE ONLY FOR DEVELOPMENT PURPOSES
const SUPER_ADMIN_ID = process.env.SUPER_ADMIN_ID;

if (!SUPER_ADMIN_ID) {
  throw new Error("SUPER_ADMIN_ID is not defined");
}
export const createDealSchema = z
  .object({
    title: z.string().min(3).max(100),
    dealType: z.nativeEnum(DealType),
    status: z.nativeEnum(DealStatus).default(DealStatus.DRAFT),

    // ownership — one of these must be set (mirrors schema: userOwnerId / orgOwnerId)
    // CHANGE THIS WHILE AUTH TESTING
    userOwnerId: z
      .string()
      .nullable()
      .optional()
      .transform((val) => val ?? SUPER_ADMIN_ID),
    orgOwnerId: z.string().nullable().optional(),

    // counterparty flat fields — mirrors schema column names exactly
    counterparty: z.object({
      name: z.string().min(3).max(100),
      email: z.string().email(),
      type: z.nativeEnum(CounterpartyType),
      contactPhone: z.string().nullable().optional(),
    }),

    // chain
    parentDealId: z.string().nullable().optional(),

    // financials
    currency: z.nativeEnum(Currency),
    agreedValue: z.coerce.number().min(0),
    cycleAmount: z.coerce.number().min(0).nullable().optional(), // null = one-time

    // schedule
    isRecurring: z.boolean().default(false),
    recurrenceInterval: z.nativeEnum(RecurrenceInterval).nullable().optional(),
    nextPaymentDate: z.coerce.date().nullable().optional(),

    // dates
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullable().optional(), // null = open-ended

    // notes
    notes: z.string().nullable().optional(),
  })
  .transform((data) => {
    return {
      ...data,
      counterparty: {
        name: data.counterparty.name,
        email: data.counterparty.email,
        type: data.counterparty.type,
        contactPhone: data.counterparty.contactPhone,
      },
    };
  })
  .refine((data) => data.userOwnerId || data.orgOwnerId, {
    message: "Either userOwnerId or orgOwnerId is required",
    path: ["userOwnerId"],
  })
  .refine((data) => !(data.userOwnerId && data.orgOwnerId), {
    message: "A deal can only have one owner (user or org, not both)",
    path: ["orgOwnerId"],
  })
  .refine((data) => !data.isRecurring || data.recurrenceInterval, {
    message: "Recurring deals require recurrenceInterval",
    path: ["isRecurring"],
  })
  .refine((data) => !data.isRecurring || data.cycleAmount != null, {
    message: "Recurring deals require a cycleAmount",
    path: ["cycleAmount"],
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: "endDate must be on or after startDate",
    path: ["endDate"],
  });
