-- AlterTable
ALTER TABLE "ExpenseStream" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "IncomeStream" ALTER COLUMN "frequency" DROP NOT NULL,
ALTER COLUMN "baseAmount" DROP NOT NULL,
ALTER COLUMN "isRecurring" SET DEFAULT false;
