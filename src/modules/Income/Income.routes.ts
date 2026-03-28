import express from "express";
import { IncomeController } from "./Income.controller";
import { authMiddleware } from "@middlewares/auth.middleware";

const router = express.Router();

// router.use(authMiddleware);

router.post("/", IncomeController.create as any);
router.get("/", IncomeController.getAll as any);
router.get("/:id", IncomeController.getById as any);
router.delete("/:id", IncomeController.delete as any);
router.put("/:id", IncomeController.update as any);

export default router;