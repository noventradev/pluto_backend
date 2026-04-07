import express from "express";
import { ExpenseController } from "./expense.controller";
import { authMiddleware } from "@middlewares/auth.middleware";

const router = express.Router();

// router.use(authMiddleware);

router.post("/", ExpenseController.create as any);
router.get("/", ExpenseController.getAll as any);
router.get("/:id", ExpenseController.getById as any);
router.delete("/:id", ExpenseController.delete as any);
router.put("/:id", ExpenseController.update as any);

export default router;
