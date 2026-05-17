import { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../../utils/response";
import { AuthService } from "./auth.service";
import { registerSchema, loginSchema } from "./auth.validator";
import { ZodError } from "zod";

function extractZodMessages(err: ZodError): string[] {
  return err.issues.map((issue) => issue.message);
}

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerSchema.parse(req.body);
      await AuthService.register(validated);

      sendSuccess(res, null, "Registration successful", 201);
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = extractZodMessages(err);
        sendError(res, messages[0], 400, messages);
        return;
      }
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const data = await AuthService.login(validated);

      sendSuccess(res, data, "Login successful");
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = extractZodMessages(err);
        sendError(res, messages[0], 400, messages);
        return;
      }
      next(err);
    }
  },

  async logout(_req: Request, res: Response) {
    sendSuccess(res, null, "Logged out successfully");
  },

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        sendError(res, "Unauthorized", 401);
        return;
      }

      const user = await AuthService.getProfile(userId);
      sendSuccess(res, user, "Profile fetched successfully");
    } catch (err) {
      next(err);
    }
  },
};
