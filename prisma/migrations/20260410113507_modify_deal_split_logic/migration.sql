/*
  Warnings:

  - You are about to drop the column `amount` on the `DealSplit` table. All the data in the column will be lost.
  - Added the required column `agreedValue` to the `DealSplit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DealSplit" DROP COLUMN "amount",
ADD COLUMN     "agreedValue" DECIMAL(14,2) NOT NULL,
ADD COLUMN     "cycleAmount" DECIMAL(14,2);
