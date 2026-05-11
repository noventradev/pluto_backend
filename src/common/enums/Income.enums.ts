export enum Frequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  ONE_TIME = 'ONE_TIME',
}

export enum EntryStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  COMPLETED = 'COMPLETED',
}

export enum ExpenseStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum IncomeType {
  ONE_TIME = 'ONE_TIME',
  RECURRING = 'RECURRING',
  CONTRACT = 'CONTRACT',
}

export enum Currency {
  INR = 'INR',
  USD = 'USD',
  GBP = 'GBP',
}
