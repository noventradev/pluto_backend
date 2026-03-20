// transaction.manager.ts
import { Prisma } from "@prisma/client";
import prisma from "./prisma.client";

export const runTransaction = async <T>(
  cb: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> => {
  return prisma.$transaction(async (tx) => {
    return cb(tx);
  });
};
