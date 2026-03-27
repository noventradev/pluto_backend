import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("Unauthorized");

    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      organizationId: decoded.organizationId,
    };

    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// import { Request, Response, NextFunction } from "express";
// import { verifyToken } from "../utils/jwt";

// export const authMiddleware = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const token = req.headers.authorization?.split(" ")[1];

//     if (!token) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     const decoded: any = verifyToken(token);

//     req.user = decoded;

//     next();
//   } catch (err) {
//     return res.status(401).json({ message: "Invalid token" });
//   }
// };

// import { Request, Response, NextFunction } from 'express';
// import { verifyToken } from '../utils/jwt.util';
// import { sendError } from '../utils/response.util';

// // ─────────────────────────────────────────────
// // Verify JWT and populate req.user
// // ─────────────────────────────────────────────
// export const authenticate = (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): void => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader?.startsWith('Bearer ')) {
//     sendError(res, 'Authorization token required', 401);
//     return;
//   }

//   const token = authHeader.split(' ')[1];

//   try {
//     req.user = verifyToken(token);
//     next();
//   } catch {
//     sendError(res, 'Invalid or expired token', 401);
//   }
// };

// // ─────────────────────────────────────────────
// // Guards
// // ─────────────────────────────────────────────

// /** Ensures the token contains an org context */
// export const requireOrganization = (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): void => {
//   if (!req.user?.organizationId) {
//     sendError(res, 'Organization context required. Re-login with an organization.', 403);
//     return;
//   }
//   next();
// };

// /** Ensures the route :organizationId matches the token's org */
// export const requireSameOrg = (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): void => {
//   const orgIdParam = req.params['organizationId'];
//   if (!orgIdParam) {
//     sendError(res, 'Organization ID param missing', 400);
//     return;
//   }
//   if (req.user?.organizationId !== orgIdParam && req.user?.roleName !== 'SUPER_ADMIN') {
//     sendError(res, 'Access denied to this organization', 403);
//     return;
//   }
//   next();
// };

// /** Requires ADMIN or SUPER_ADMIN role */
// export const requireOrgAdmin = (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): void => {
//   const role = req.user?.roleName;
//   if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
//     sendError(res, 'Organization admin access required', 403);
//     return;
//   }
//   next();
// };

// /** Requires SUPER_ADMIN role */
// export const requireSuperAdmin = (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): void => {
//   if (req.user?.roleName !== 'SUPER_ADMIN') {
//     sendError(res, 'Super admin access required', 403);
//     return;
//   }
//   next();
// };
