import prisma from "@db/prisma.client";

export const AuthRepository = {
  findByEmail: (email: string) =>
    prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
      },
    }),

  findById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    }),

  create: (data: { firstName: string; email: string; password: string }) =>
    prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: "",
        email: data.email,
        password: data.password,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    }),
};
