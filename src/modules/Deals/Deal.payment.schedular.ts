import { Currency, PaymentStatus, Prisma, RecurrenceInterval } from "@prisma/client";

export function generatePaymentSchedule(
    dealId: string,
    currency: Currency,
    agreedValue: number,
    isRecurring: boolean,
    cycleAmount: number | null,
    recurrenceInterval: RecurrenceInterval | null,
    startDate: Date,
    endDate: Date | null,
    nextPaymentDate: Date | null,
    createdBy: string,
): Prisma.PaymentCreateManyInput[] {
    if (!createdBy) {
        createdBy = process.env.SUPER_ADMIN_ID ?? "";
    }

    if (!isRecurring || !cycleAmount || !recurrenceInterval || !nextPaymentDate) {
        return [{
            dealId,
            amount: agreedValue,
            currency,
            dueDate: nextPaymentDate ?? startDate,
            status: PaymentStatus.PENDING,
            createdBy,
        }];
    }

    const payments: Prisma.PaymentCreateManyInput[] = [];
    let remaining = agreedValue;
    let current = new Date(nextPaymentDate);
    const limit = endDate ?? addCycles(current, recurrenceInterval, 24);
    const MAX = 120;

    let i = 0;
    while (current <= limit && remaining > 0 && i < MAX) {
        const isLast = remaining <= cycleAmount;
        const amount = isLast ? remaining : cycleAmount;
        payments.push({
            dealId,
            amount,
            currency,
            dueDate: new Date(current),
            status: PaymentStatus.PENDING,
            createdBy,
        });
        remaining -= amount;
        current = addCycles(current, recurrenceInterval, 1);
        i++;
    }
    return payments;
}

function addCycles(date: Date, interval: string, count: number): Date {
    const d = new Date(date);
    switch (interval) {
        case RecurrenceInterval.quarterly:
            d.setMonth(d.getMonth() + count * 3);
            break;
        case RecurrenceInterval.monthly:
            d.setMonth(d.getMonth() + count);
            break;
        case RecurrenceInterval.yearly:
            d.setFullYear(d.getFullYear() + count);
            break;
        case RecurrenceInterval.weekly:
            d.setDate(d.getDate() + count * 7);
            break;
        default:
            break;
    }
    return d;
}