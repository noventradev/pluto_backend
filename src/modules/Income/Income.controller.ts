import { Response } from "express";
import { ApiResponse, AuthRequest } from "../../common/types/common.types";
import { CreateIncomeRequestDto } from "./Income.types";
import { IncomeService } from "./Income.service";
import { createIncomeSchema, updateIncomeSchema } from "./Income.validator";
import { UpdateIncomeRequestDto } from "./Income.types";

const STATIC_USER = {
    id: "9e12559d-b7c2-4c1c-9f4c-b4de4ec80f89",
    email: "[noventradevelopers@gmail.com]",
    role: "SUPER_ADMIN",
    organizationId: "559c053b-0512-43bf-bbf9-bdb25734b388"
};

export const IncomeController = {
    async create(
        req: AuthRequest<CreateIncomeRequestDto>,
        res: Response<ApiResponse<any>>
    ) {
        console.log("Raw body:", req.body);
        try {
            const validatedData = createIncomeSchema.parse(req.body);
            const user = req.user || STATIC_USER;
            const data = await IncomeService.create(validatedData as any, user as any);

            return res.json({
                success: true,
                message: "Income created successfully",
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

    async getAll(
        req: AuthRequest,
        res: Response<ApiResponse<any>>
    ) {
        const user = req.user || STATIC_USER;
        const data = await IncomeService.getAll(user as any);

        return res.json({
            success: true,
            message: "Income list fetched",
            data,
        });
    },

    async getById(
        req: AuthRequest,
        res: Response<ApiResponse<any>>
    ) {
        try {
            const user = req.user || STATIC_USER;
            const data = await IncomeService.getById(
                req.params.id as string,
                user as any
            );

            return res.json({
                success: true,
                message: "Income fetched",
                data,
            });
        } catch (err: any) {
            return res.status(404).json({
                success: false,
                message: err.message,
            });
        }
    },

    async delete(
        req: AuthRequest,
        res: Response<ApiResponse<null>>
    ) {
        const user = req.user || STATIC_USER;
        await IncomeService.delete(req.params.id as string, user as any);

        return res.json({
            success: true,
            message: "Income deleted",
            data: null,
        });
    },

    async update(
        req: AuthRequest<UpdateIncomeRequestDto>,
        res: Response<ApiResponse<any>>
    ) {
        try {
            console.log("Raw body:", req.body);
            const validatedData = updateIncomeSchema.parse(req.body);
            const user = req.user || STATIC_USER;
            console.log(req.params.id)
            const data = await IncomeService.update(
                req.params.id as string,
                validatedData as any,
                user as any
            );

            return res.json({
                success: true,
                message: "Income updated successfully",
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