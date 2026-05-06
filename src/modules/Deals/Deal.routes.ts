import express from "express";
import { DealController } from "./Deal.controller";

const router = express.Router();

router.post("/", DealController.create as any);
router.get("/", DealController.getAll as any);
router.get("/:id", DealController.getById as any);
router.post("/:id/splits", DealController.createSplit as any);
router.get("/:id/splits", DealController.getSplits as any);

export default router;
