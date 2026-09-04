"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiProxyController_1 = require("../controllers/aiProxyController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post('/voice-parse', authMiddleware_1.authenticateJwt, aiProxyController_1.parseVoiceCommand);
router.post('/sos-trigger', authMiddleware_1.authenticateJwt, aiProxyController_1.triggerEmergencySos);
exports.default = router;
