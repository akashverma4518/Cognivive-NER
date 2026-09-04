"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const caregiverController_1 = require("../controllers/caregiverController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const router = (0, express_1.Router)();
// Only Caregiver, Clinician, or Admin
router.use(authMiddleware_1.authenticateJwt);
router.use((0, roleMiddleware_1.requireRole)(['CAREGIVER', 'CLINICIAN', 'ADMIN']));
router.get('/patients', caregiverController_1.getPatients);
router.get('/patients/:patientId', caregiverController_1.getPatientDetail);
router.get('/patients/:patientId/trends', caregiverController_1.getPatientTrends);
router.get('/patients/:patientId/games', caregiverController_1.getPatientGames);
router.get('/patients/:patientId/reminders', caregiverController_1.getPatientReminders);
router.post('/patients/:patientId/games/:gameId/difficulty', caregiverController_1.overrideDifficulty);
router.get('/alerts', caregiverController_1.getAlerts);
exports.default = router;
