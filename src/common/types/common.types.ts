import { Request } from "express";

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  isActive?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  organizationId?: string;
  roleId?: string;
  roleName?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  organizationId?: string;
}

export interface AuthRequest<T = any> extends Request {
  body: T;
  user: AuthUser;
}

export interface ListResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
