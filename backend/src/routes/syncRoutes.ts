import { Router } from 'express';
import { syncBatch } from '../controllers/syncController';
import { authenticateJwt } from '../middleware/authMiddleware';

const router = Router();

router.post('/batch', authenticateJwt, syncBatch);

export default router;
