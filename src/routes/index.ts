import { Router } from "express";
import healthRoutes from "./health.routes";
import incomeRoutes from "../modules/Income/Income.routes";
import authRoutes from "../modules/auth/auth.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
// router.use("/users", require("../modules/user/user.routes").default);
router.use("/incomes", incomeRoutes);
// router.use("/expenses", require("../modules/expense/expense.routes").default);

export default router;