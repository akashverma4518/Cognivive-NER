import axios from 'axios';
import { ENV } from '../config/env';

const aiApi = axios.create({
  baseURL: ENV.AI_SERVICE_URL,
  timeout: 6000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export class AiServiceClient {
  static async checkHealth() {
    try {
      const res = await aiApi.get('/health');
      return res.data;
    } catch (err: any) {
      console.error('[AI Service Client] Health check failed:', err.message);
      return { status: 'UNREACHABLE', error: err.message };
    }
  }

  static async evaluateSession(sessionData: any, currentDomainScores?: any) {
    try {
      const res = await aiApi.post('/ai/v1/evaluate-session', {
        session: sessionData,
        current_domain_scores: currentDomainScores
      });
      return res.data;
    } catch (err: any) {
      console.error('[AI Service Client] evaluateSession failed:', err.message);
      throw new Error(`AI Service evaluation failed: ${err.message}`);
    }
  }

  static async detectChange(patientId: string, baselineIndex: number, recentSessions: any[]) {
    try {
      const res = await aiApi.post('/ai/v1/detect-change', {
        patient_id: patientId,
        baseline_activity_index: baselineIndex,
        recent_sessions: recentSessions
      });
      return res.data;
    } catch (err: any) {
      console.error('[AI Service Client] detectChange failed:', err.message);
      throw new Error(`AI Service change detection failed: ${err.message}`);
    }
  }

  static async getRecommendations(requestPayload: any) {
    try {
      const res = await aiApi.post('/ai/v1/recommendations', requestPayload);
      return res.data;
    } catch (err: any) {
      console.error('[AI Service Client] getRecommendations failed:', err.message);
      throw new Error(`AI Service recommendations failed: ${err.message}`);
    }
  }

  static async parseVoice(text: string, language: string = 'en') {
    try {
      const res = await aiApi.post('/ai/v1/parse-voice', { text, language });
      return res.data;
    } catch (err: any) {
      console.error('[AI Service Client] parseVoice failed:', err.message);
      throw new Error(`AI Service voice parsing failed: ${err.message}`);
    }
  }
}
