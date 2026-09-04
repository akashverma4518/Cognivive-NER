import { Router } from 'express';
import { authenticateJwt } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import {
  getMyDayOverview,
  getWellnessActivities,
  logWellnessActivity,
  getFamilyMemories,
  addFamilyMemory,
  deleteFamilyMemory,
  getCaregiverNotes,
  addCaregiverNote,
  getActionCenterAlerts,
  getPatientProgressReport
} from '../controllers/careCompanionController';

const router = Router();

// All care companion routes require authentication
router.use(authenticateJwt);

// My Day
router.get('/my-day', getMyDayOverview);

// Wellness activities
router.get('/wellness', getWellnessActivities);
router.post('/wellness', logWellnessActivity);

// Family Memory Vault
router.get('/family-memories', getFamilyMemories);
router.post('/family-memories', addFamilyMemory);
router.delete('/family-memories/:id', deleteFamilyMemory);

// Caregiver observational notes
router.get('/notes', requireRole(['CAREGIVER', 'CLINICIAN', 'ADMIN']), getCaregiverNotes);
router.post('/notes', requireRole(['CAREGIVER', 'CLINICIAN', 'ADMIN']), addCaregiverNote);

// Caregiver Action Center
router.get('/action-center', requireRole(['CAREGIVER', 'CLINICIAN', 'ADMIN']), getActionCenterAlerts);

// Progress Report
router.get('/progress-report/:patientId', requireRole(['CAREGIVER', 'CLINICIAN', 'ADMIN']), getPatientProgressReport);

export default router;
