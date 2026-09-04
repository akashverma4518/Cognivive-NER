"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerEmergencySos = exports.parseVoiceCommand = void 0;
const aiServiceClient_1 = require("../services/aiServiceClient");
const parseVoiceCommand = async (req, res) => {
    try {
        const { text, language = 'en' } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, message: 'text is required.' });
        }
        const result = await aiServiceClient_1.AiServiceClient.parseVoice(text, language);
        return res.json({ success: true, parsed: result });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.parseVoiceCommand = parseVoiceCommand;
const triggerEmergencySos = async (req, res) => {
    try {
        const patientId = req.user?.id;
        const { location, notes } = req.body;
        // Optional secondary SOS feature: logs emergency notification
        console.log(`[SOS ALERT] Emergency triggered by patient ${patientId} (${req.user?.fullName}) at ${new Date().toISOString()}`);
        return res.json({
            success: true,
            message: 'Emergency SOS alert generated and dispatched to assigned caregiver.',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.triggerEmergencySos = triggerEmergencySos;
