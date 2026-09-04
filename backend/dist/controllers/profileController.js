"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDailyRecommendations = exports.setBaselineActivity = exports.getCognitiveProfile = void 0;
const db_1 = require("../config/db");
const aiServiceClient_1 = require("../services/aiServiceClient");
const getCognitiveProfile = async (req, res) => {
    try {
        const patientId = req.params.patientId || req.user?.id;
        const profileRes = await (0, db_1.query)(`SELECT * FROM cognitive_profiles WHERE patient_id = $1`, [patientId]);
        if (profileRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Cognitive profile not found for user.' });
        }
        const patientRes = await (0, db_1.query)(`SELECT status, baseline_activity_index FROM patient_profiles WHERE user_id = $1`, [patientId]);
        return res.json({
            success: true,
            profile: profileRes.rows[0],
            patientInfo: patientRes.rows[0] || null
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCognitiveProfile = getCognitiveProfile;
const setBaselineActivity = async (req, res) => {
    try {
        const patientId = req.user?.id;
        const { baselineIndex, domainScores } = req.body;
        if (baselineIndex === undefined) {
            return res.status(400).json({ success: false, message: 'baselineIndex is required.' });
        }
        await (0, db_1.query)(`UPDATE patient_profiles 
       SET baseline_activity_index = $1, status = 'STABLE', updated_at = NOW() 
       WHERE user_id = $2`, [baselineIndex, patientId]);
        if (domainScores) {
            await (0, db_1.query)(`UPDATE cognitive_profiles
         SET overall_performance_score = $1,
             working_memory_score = $2,
             processing_speed_score = $3,
             attention_score = $4,
             executive_flexibility_score = $5,
             reminiscence_score = $6,
             last_evaluated_at = NOW()
         WHERE patient_id = $7`, [
                baselineIndex,
                domainScores.workingMemory || 50.0,
                domainScores.processingSpeed || 50.0,
                domainScores.attention || 50.0,
                domainScores.executiveFlexibility || 50.0,
                domainScores.reminiscence || 50.0,
                patientId
            ]);
        }
        return res.json({
            success: true,
            message: 'Baseline activity index established successfully.',
            baselineIndex
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.setBaselineActivity = setBaselineActivity;
const getDailyRecommendations = async (req, res) => {
    try {
        const patientId = req.user?.id;
        const profileRes = await (0, db_1.query)(`SELECT * FROM cognitive_profiles WHERE patient_id = $1`, [patientId]);
        const profile = profileRes.rows[0] || {
            working_memory_score: 50.0,
            processing_speed_score: 50.0,
            attention_score: 50.0,
            executive_flexibility_score: 50.0,
            reminiscence_score: 50.0,
            consistency_index: 75.0
        };
        // Call Python AI Service
        const aiRecs = await aiServiceClient_1.AiServiceClient.getRecommendations({
            patient_id: patientId,
            working_memory_score: parseFloat(profile.working_memory_score),
            processing_speed_score: parseFloat(profile.processing_speed_score),
            attention_score: parseFloat(profile.attention_score),
            executive_flexibility_score: parseFloat(profile.executive_flexibility_score),
            reminiscence_score: parseFloat(profile.reminiscence_score),
            consistency_index: parseFloat(profile.consistency_index)
        });
        return res.json({
            success: true,
            recommendations: aiRecs
        });
    }
    catch (error) {
        console.error('[getDailyRecommendations error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDailyRecommendations = getDailyRecommendations;
