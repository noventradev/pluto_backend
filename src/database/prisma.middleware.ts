// transaction.manager.ts
import { prisma } from "./prisma.client";

export const runTransaction = async (cb: any) => {
  return prisma.$transaction(async (tx: any) => {
    return cb(tx);
  });
};
