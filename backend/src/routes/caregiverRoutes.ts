import { Router } from 'express';
import {
  getPatients,
  getPatientDetail,
  getPatientTrends,
  getPatientGames,
  getPatientReminders,
  overrideDifficulty,
  getAlerts
} from '../controllers/caregiverController';
import { authenticateJwt } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

// Only Caregiver, Clinician, or Admin
router.use(authenticateJwt);
router.use(requireRole(['CAREGIVER', 'CLINICIAN', 'ADMIN']));

router.get('/patients', getPatients);
router.get('/patients/:patientId', getPatientDetail);
router.get('/patients/:patientId/trends', getPatientTrends);
router.get('/patients/:patientId/games', getPatientGames);
router.get('/patients/:patientId/reminders', getPatientReminders);
router.post('/patients/:patientId/games/:gameId/difficulty', overrideDifficulty);
router.get('/alerts', getAlerts);

export default router;
