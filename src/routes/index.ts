// routes/index.ts
import { Router } from 'express';
import healthRoutes from './health.routes';
import dealRoutes from "../modules/Deals/Deal.routes";

const router = Router();

router.use('/health', healthRoutes);
router.use('/deals', dealRoutes);

export default router;