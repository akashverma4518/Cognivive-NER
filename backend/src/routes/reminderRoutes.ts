import { Router } from 'express';
import {
  getTodayReminders,
  acknowledgeReminder,
  createReminder,
  updateReminder,
  deleteReminder
} from '../controllers/reminderController';
import { authenticateJwt } from '../middleware/authMiddleware';

const router = Router();

router.get('/today', authenticateJwt, getTodayReminders);
router.post('/:id/acknowledge', authenticateJwt, acknowledgeReminder);
router.post('/', authenticateJwt, createReminder);
router.put('/:id', authenticateJwt, updateReminder);
router.delete('/:id', authenticateJwt, deleteReminder);

export default router;
