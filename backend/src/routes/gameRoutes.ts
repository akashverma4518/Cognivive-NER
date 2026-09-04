import { Router } from 'express';
import { getGames, getGameState, recordSession } from '../controllers/gameSessionController';
import { authenticateJwt } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateJwt, getGames);
router.get('/:gameId/state', authenticateJwt, getGameState);
router.post('/session', authenticateJwt, recordSession);

export default router;
