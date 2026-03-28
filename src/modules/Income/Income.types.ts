import { EntryStatus, Frequency, Currency, IncomeType } from "@prisma/client";

export interface IncomeSourceData {
  organizationId: string;
  userId: string;
  sourceOfIncome: string;
  name: string;
  type: IncomeType;
  isActive?: boolean;
  createdBy?: string;
  updatedBy?: string;
}

export interface IncomeStreamData {
  organizationId: string;
  sourceId?: string;
  startDate: Date;
  endDate?: Date | null;
  frequency: Frequency;
  baseAmount: number;
  currency: Currency;
  isActive?: boolean;
  createdBy?: string;
}

export interface IncomeEntryData {
  organizationId: string;
  streamId?: string;
  date: Date;
  estimatedAmount?: number | null;
  actualAmount?: number | null;
  status?: EntryStatus;
  note?: string | null;
  createdBy?: string;
}

export interface CreateIncomeRequestDto {
  source: {
    sourceOfIncome: string;
    name: string;
    type: IncomeType;
  };

  stream: {
    startDate: Date;
    endDate?: Date;
    frequency: Frequency;
    baseAmount: number;
    currency: Currency;
  };

  entry: {
    date: Date;
    actualAmount?: number;
    note?: string;
  };
}

export type UpdateIncomeRequestDto = Partial<CreateIncomeRequestDto>;

export interface IncomeCreatePayload {
  source: IncomeSourceData;
  stream: Omit<IncomeStreamData, "sourceId">;
  entries: Omit<IncomeEntryData, "streamId">[];
}

export interface IncomeUpdatePayload {
  source?: Partial<IncomeSourceData>;
  stream?: Partial<IncomeStreamData>;
  entries?: IncomeEntryData[];
  deleteEntryIds?: string[];
}

export interface IncomeResponseDto {
  id: string;
  sourceName: string;
  totalAmount: number;
}