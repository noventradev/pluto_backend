import express from "express";
import { DealController } from "./Deal.controller";

const router = express.Router();

router.post("/", DealController.create as any);

export default router;
