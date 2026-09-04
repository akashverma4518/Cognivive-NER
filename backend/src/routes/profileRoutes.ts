import { Router } from 'express';
import { getCognitiveProfile, setBaselineActivity, getDailyRecommendations } from '../controllers/profileController';
import { authenticateJwt } from '../middleware/authMiddleware';

const router = Router();

router.get('/cognitive', authenticateJwt, getCognitiveProfile);
router.get('/cognitive/:patientId', authenticateJwt, getCognitiveProfile);
router.post('/baseline', authenticateJwt, setBaselineActivity);
router.get('/recommendations', authenticateJwt, getDailyRecommendations);

export default router;
