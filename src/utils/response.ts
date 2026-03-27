import { ApiResponse, PaginationMeta } from "common/types/common.types";
import { Response } from "express";

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200,
  meta?: PaginationMeta,
): Response => {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data,
    ...(meta !== undefined && { meta }),
  };
  return res.status(statusCode).json(body);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  errors?: string[],
): Response => {
  const body: ApiResponse<null> = {
    success: false,
    message,
    ...(errors !== undefined && { errors }),
  };
  return res.status(statusCode).json(body);
};

export interface ParsedPagination {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export const parsePagination = (
  rawPage?: string,
  rawLimit?: string,
): ParsedPagination => {
  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(rawLimit ?? "10", 10) || 10),
  );
  return { skip: (page - 1) * limit, take: limit, page, limit };
};

export const buildMeta = (
  total: number,
  page: number,
  limit: number,
): PaginationMeta => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});
