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
  isRecurring: boolean;
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
  isRecurring: boolean;
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

export type UpdateIncomeRequestDto = Partial<Omit<CreateIncomeRequestDto, 'entry' | 'stream'>> & {
  stream?: Partial<CreateIncomeRequestDto['stream']> & { id?: string };
  entry?: Partial<CreateIncomeRequestDto['entry']> & { id?: string };
};

export interface IncomeCreatePayload {
  isRecurring: boolean;
  source: IncomeSourceData;
  stream: Omit<IncomeStreamData, "sourceId">;
  entries: Omit<IncomeEntryData, "streamId">[];
}

export interface IncomeUpdatePayload {
  isRecurring?: boolean;
  source?: Partial<IncomeSourceData & { id: string }>;
  stream?: Partial<IncomeStreamData & { id: string }>;
  entries?: IncomeEntryData[];
  entryToUpdate?: Partial<IncomeEntryData> & { id: string };
  deleteEntryIds?: string[];
}

export interface IncomeResponseDto {
  id: string;
  sourceName: string;
  totalAmount: number;
}