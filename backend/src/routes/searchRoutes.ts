import { Router } from 'express';
import { authenticateJwt } from '../middleware/authMiddleware';
import { searchGlobal } from '../controllers/searchController';

const router = Router();

// GET /api/search?q=...
// Protected route ensuring caller identity and RBAC
router.get('/', authenticateJwt, searchGlobal);

export default router;
