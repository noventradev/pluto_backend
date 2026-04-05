import { ApiResponse, AuthRequest } from "common/types/common.types";
import { Response } from "express";
import { DealService } from "./Deal.service";
import { createDealRequestDTO } from "./Deal.types";
import { createDealSchema } from "./Deal.validator";

const STATIC_USER = {
  id: process.env.SUPER_ADMIN_ID,
  email: process.env.SUPER_ADMIN_EMAIL,
  role: process.env.SUPER_ADMIN_ROLE,
  organizationId: process.env.SUPER_ADMIN_ORGANIZATION_ID,
};
export const DealController = {
  async create(
    req: AuthRequest<createDealRequestDTO>,
    res: Response<ApiResponse<any>>,
  ) {
    try {
      console.log("req.body", req.body);
      const validateData = createDealSchema.parse(req.body);
      const user = req.user || STATIC_USER;
      const data = await DealService.create(validateData as any, user as any);

      return res.json({
        success: true,
        message: "Deal created successfully",
        data,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message,
        errors: [err.message],
      });
    }
  },
};
