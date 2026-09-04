import { Router } from 'express';
import { parseVoiceCommand, triggerEmergencySos } from '../controllers/aiProxyController';
import { authenticateJwt } from '../middleware/authMiddleware';

const router = Router();

router.post('/voice-parse', authenticateJwt, parseVoiceCommand);
router.post('/sos-trigger', authenticateJwt, triggerEmergencySos);

export default router;
