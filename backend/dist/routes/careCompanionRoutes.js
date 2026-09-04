"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const careCompanionController_1 = require("../controllers/careCompanionController");
const router = (0, express_1.Router)();
// All care companion routes require authentication
router.use(authMiddleware_1.authenticateJwt);
// My Day
router.get('/my-day', careCompanionController_1.getMyDayOverview);
// Wellness activities
router.get('/wellness', careCompanionController_1.getWellnessActivities);
router.post('/wellness', careCompanionController_1.logWellnessActivity);
// Family Memory Vault
router.get('/family-memories', careCompanionController_1.getFamilyMemories);
router.post('/family-memories', careCompanionController_1.addFamilyMemory);
router.delete('/family-memories/:id', careCompanionController_1.deleteFamilyMemory);
// Caregiver observational notes
router.get('/notes', (0, roleMiddleware_1.requireRole)(['CAREGIVER', 'CLINICIAN', 'ADMIN']), careCompanionController_1.getCaregiverNotes);
router.post('/notes', (0, roleMiddleware_1.requireRole)(['CAREGIVER', 'CLINICIAN', 'ADMIN']), careCompanionController_1.addCaregiverNote);
// Caregiver Action Center
router.get('/action-center', (0, roleMiddleware_1.requireRole)(['CAREGIVER', 'CLINICIAN', 'ADMIN']), careCompanionController_1.getActionCenterAlerts);
// Progress Report
router.get('/progress-report/:patientId', (0, roleMiddleware_1.requireRole)(['CAREGIVER', 'CLINICIAN', 'ADMIN']), careCompanionController_1.getPatientProgressReport);
exports.default = router;
