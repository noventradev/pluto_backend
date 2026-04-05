import {
    CounterpartyType,
    Currency,
    DealStatus,
    DealType,
    RecurrenceInterval,
} from "@prisma/client";

export interface createDealRequestDTO {
    title: string;
    dealType: DealType;
    status: DealStatus;

    // ownership — one of these must be set
    userOwnerId?: string | null;
    orgOwnerId?: string | null;

    // counterparty (embedded, flat — mirrors schema fields)
    counterparty: {
        name: string;
        email: string;
        type: CounterpartyType;
        contactPhone?: string | null;
    };

    // chain
    parentDealId?: string | null;

    // financials
    currency: Currency;
    agreedValue: number;
    cycleAmount?: number | null; // null = one-time

    // schedule
    isRecurring: boolean;
    recurrenceInterval?: RecurrenceInterval | null;
    nextPaymentDate?: Date | null;

    // dates
    startDate: Date;
    endDate?: Date | null; // null = open-ended deal

    // notes
    notes?: string | null;
}
