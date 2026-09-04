"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiServiceClient = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const aiApi = axios_1.default.create({
    baseURL: env_1.ENV.AI_SERVICE_URL,
    timeout: 6000,
    headers: {
        'Content-Type': 'application/json'
    }
});
class AiServiceClient {
    static async checkHealth() {
        try {
            const res = await aiApi.get('/health');
            return res.data;
        }
        catch (err) {
            console.error('[AI Service Client] Health check failed:', err.message);
            return { status: 'UNREACHABLE', error: err.message };
        }
    }
    static async evaluateSession(sessionData, currentDomainScores) {
        try {
            const res = await aiApi.post('/ai/v1/evaluate-session', {
                session: sessionData,
                current_domain_scores: currentDomainScores
            });
            return res.data;
        }
        catch (err) {
            console.error('[AI Service Client] evaluateSession failed:', err.message);
            throw new Error(`AI Service evaluation failed: ${err.message}`);
        }
    }
    static async detectChange(patientId, baselineIndex, recentSessions) {
        try {
            const res = await aiApi.post('/ai/v1/detect-change', {
                patient_id: patientId,
                baseline_activity_index: baselineIndex,
                recent_sessions: recentSessions
            });
            return res.data;
        }
        catch (err) {
            console.error('[AI Service Client] detectChange failed:', err.message);
            throw new Error(`AI Service change detection failed: ${err.message}`);
        }
    }
    static async getRecommendations(requestPayload) {
        try {
            const res = await aiApi.post('/ai/v1/recommendations', requestPayload);
            return res.data;
        }
        catch (err) {
            console.error('[AI Service Client] getRecommendations failed:', err.message);
            throw new Error(`AI Service recommendations failed: ${err.message}`);
        }
    }
    static async parseVoice(text, language = 'en') {
        try {
            const res = await aiApi.post('/ai/v1/parse-voice', { text, language });
            return res.data;
        }
        catch (err) {
            console.error('[AI Service Client] parseVoice failed:', err.message);
            throw new Error(`AI Service voice parsing failed: ${err.message}`);
        }
    }
}
exports.AiServiceClient = AiServiceClient;
