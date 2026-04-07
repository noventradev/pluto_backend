import { ExpenseStatus, Frequency } from "@prisma/client";

export interface ExpenseCategoryData {
  organizationId: string;
  userId: string;
  name: string;
  type: string;
  description?: string | null;
  isActive?: boolean;
  createdBy?: string;
  updatedBy?: string;
}

export interface ExpenseStreamData {
  organizationId: string;
  categoryId?: string;
  startDate: Date;
  endDate?: Date | null;
  frequency: Frequency;
  baseAmount: number;
  currency: string;
  isRecurring: boolean;
  isActive?: boolean;
  createdBy?: string;
}

export interface ExpenseEntryData {
  organizationId: string;
  streamId?: string;
  date: Date;
  amount: number;
  status?: ExpenseStatus;
  note?: string | null;
  createdBy?: string;
}

export interface CreateExpenseRequestDto {
  isRecurring: boolean;
  category: {
    name: string;
    type: string;
    description?: string;
  };

  stream: {
    startDate: Date;
    endDate?: Date;
    frequency: Frequency;
    baseAmount: number;
    currency: string;
  };

  entry: {
    date: Date;
    amount: number;
    note?: string;
  };
}

export type UpdateExpenseRequestDto = Partial<Omit<CreateExpenseRequestDto, 'entry' | 'stream'>> & {
  stream?: Partial<CreateExpenseRequestDto['stream']> & { id?: string };
  entry?: Partial<CreateExpenseRequestDto['entry']> & { id?: string };
};

export interface ExpenseCreatePayload {
  isRecurring: boolean;
  category: ExpenseCategoryData;
  stream: Omit<ExpenseStreamData, "categoryId">;
  entries: Omit<ExpenseEntryData, "streamId">[];
}

export interface ExpenseUpdatePayload {
  isRecurring?: boolean;
  category?: Partial<ExpenseCategoryData & { id: string }>;
  stream?: Partial<ExpenseStreamData & { id: string }>;
  entries?: ExpenseEntryData[];
  entryToUpdate?: Partial<ExpenseEntryData> & { id: string };
  deleteEntryIds?: string[];
}

export interface ExpenseResponseDto {
  id: string;
  categoryName: string;
  totalAmount: number;
}
