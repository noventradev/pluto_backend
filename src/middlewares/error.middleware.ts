import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { sendError } from "../utils/response";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean = true;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─────────────────────────────────────────────
// 404 handler (place before errorHandler)
// ─────────────────────────────────────────────
export const notFoundHandler = (_req: Request, res: Response): void => {
  sendError(res, `Route ${_req.method} ${_req.originalUrl} not found`, 404);
};

// ─────────────────────────────────────────────
// Global error handler
// ─────────────────────────────────────────────
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Operational errors we threw intentionally
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const target = Array.isArray(err.meta?.["target"])
          ? (err.meta["target"] as string[]).join(", ")
          : "field";
        sendError(res, `Duplicate value on unique field: ${target}`, 409);
        return;
      }
      case "P2025":
        sendError(res, "Record not found", 404);
        return;
      case "P2003":
        sendError(
          res,
          "Related record not found (foreign key constraint)",
          400,
        );
        return;
      case "P2014":
        sendError(res, "Required relation violation", 400);
        return;
      default:
        sendError(res, "Database error", 500);
        return;
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    sendError(res, "Invalid data provided to database", 400);
    return;
  }

  // Unknown errors
  const message = err instanceof Error ? err.message : "Internal server error";
  console.error("[Unhandled Error]", err);
  sendError(res, message, 500);
};
