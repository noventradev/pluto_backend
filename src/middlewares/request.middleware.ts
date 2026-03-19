import { v4 as uuidv4 } from "uuid";

export const requestMiddleware = (req: any, res: any, next: any) => {
  req.requestId = uuidv4();

  // SaaS tenant extraction
  req.tenantId = req.headers["x-tenant-id"] || null;

  next();
};
