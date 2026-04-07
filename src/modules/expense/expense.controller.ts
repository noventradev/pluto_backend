import { Response } from "express";
import { ApiResponse, AuthRequest } from "../../common/types/common.types";
import { CreateExpenseRequestDto, UpdateExpenseRequestDto } from "./expense.types";
import { ExpenseService } from "./expense.service";
import { createExpenseSchema, updateExpenseSchema } from "./expense.validator";

const STATIC_USER = {
    id: "9e12559d-b7c2-4c1c-9f4c-b4de4ec80f89",
    email: "noventradevelopers@gmail.com",
    role: "SUPER_ADMIN",
    organizationId: "559c053b-0512-43bf-bbf9-bdb25734b388"
};

export const ExpenseController = {
    async create(
        req: AuthRequest<CreateExpenseRequestDto>,
        res: Response<ApiResponse<any>>
    ) {
        console.log("Raw body:", req.body);
        try {
            const validatedData = createExpenseSchema.parse(req.body);
            const user = req.user || STATIC_USER;
            const data = await ExpenseService.create(validatedData as any, user as any);

            return res.json({
                success: true,
                message: "Expense created successfully",
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
        const data = await ExpenseService.getAll(user as any);

        return res.json({
            success: true,
            message: "Expense list fetched",
            data,
        });
    },

    async getById(
        req: AuthRequest,
        res: Response<ApiResponse<any>>
    ) {
        try {
            const user = req.user || STATIC_USER;
            const data = await ExpenseService.getById(
                req.params.id as string,
                user as any
            );

            return res.json({
                success: true,
                message: "Expense fetched",
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
        await ExpenseService.delete(req.params.id as string, user as any);

        return res.json({
            success: true,
            message: "Expense deleted",
            data: null,
        });
    },

    async update(
        req: AuthRequest<UpdateExpenseRequestDto>,
        res: Response<ApiResponse<any>>
    ) {
        try {
            console.log("Raw body:", req.body);
            const validatedData = updateExpenseSchema.parse(req.body);
            const user = req.user || STATIC_USER;
            console.log(req.params.id)
            const data = await ExpenseService.update(
                req.params.id as string,
                validatedData as any,
                user as any
            );

            return res.json({
                success: true,
                message: "Expense updated successfully",
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
