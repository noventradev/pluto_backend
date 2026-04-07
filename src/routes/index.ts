import { Router } from "express";
import healthRoutes from "./health.routes";
import incomeRoutes from "../modules/Income/Income.routes";

const router = Router();

router.use("/health", healthRoutes);
// router.use("/auth", require("../modules/auth/auth.routes").default);
// router.use("/users", require("../modules/user/user.routes").default);
router.use("/incomes", incomeRoutes);
// router.use("/expenses", require("../modules/expense/expense.routes").default);

export default router;