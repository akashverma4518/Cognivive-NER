"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncBatch = void 0;
const db_1 = require("../config/db");
const syncBatch = async (req, res) => {
    try {
        const patientId = req.user?.id;
        const { batchId, sessions = [], reminderLogs = [] } = req.body;
        if (!batchId) {
            return res.status(400).json({ success: false, message: 'batchId is required.' });
        }
        let syncedSessionsCount = 0;
        let syncedLogsCount = 0;
        // 1. Process offline game sessions
        for (const s of sessions) {
            const sessionId = s.id || undefined;
            let insertQuery = `
        INSERT INTO game_sessions 
        (patient_id, game_id, difficulty_level, duration_seconds, score, accuracy_percentage, average_reaction_time_ms, mistakes_count, consecutive_correct, telemetry_payload, client_created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING
      `;
            let params = [
                patientId,
                s.gameId,
                s.difficultyLevel,
                s.durationSeconds,
                s.score,
                s.accuracyPercentage,
                s.averageReactionTimeMs,
                s.mistakesCount || 0,
                s.consecutiveCorrect || 0,
                JSON.stringify(s.telemetryPayload || {}),
                s.clientCreatedAt || new Date()
            ];
            if (sessionId) {
                insertQuery = `
          INSERT INTO game_sessions 
          (id, patient_id, game_id, difficulty_level, duration_seconds, score, accuracy_percentage, average_reaction_time_ms, mistakes_count, consecutive_correct, telemetry_payload, client_created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO NOTHING
        `;
                params = [
                    sessionId,
                    patientId,
                    s.gameId,
                    s.difficultyLevel,
                    s.durationSeconds,
                    s.score,
                    s.accuracyPercentage,
                    s.averageReactionTimeMs,
                    s.mistakesCount || 0,
                    s.consecutiveCorrect || 0,
                    JSON.stringify(s.telemetryPayload || {}),
                    s.clientCreatedAt || new Date()
                ];
            }
            await (0, db_1.query)(insertQuery, params);
            syncedSessionsCount++;
        }
        // 2. Process offline reminder logs
        for (const r of reminderLogs) {
            const remStatus = r.status || 'TAKEN';
            await (0, db_1.query)(`INSERT INTO reminder_logs (reminder_id, patient_id, scheduled_date, status, acknowledged_at, voice_confirmed, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (reminder_id, scheduled_date)
         DO UPDATE SET status = $4, acknowledged_at = $5, voice_confirmed = $6, notes = $7`, [
                r.reminderId,
                patientId,
                r.scheduledDate || new Date().toISOString().split('T')[0],
                remStatus,
                r.acknowledgedAt || new Date(),
                r.voiceConfirmed || false,
                r.notes || 'Offline synced'
            ]);
            syncedLogsCount++;
        }
        // 3. Record sync audit log
        const totalRecords = syncedSessionsCount + syncedLogsCount;
        await (0, db_1.query)(`INSERT INTO offline_sync_logs (patient_id, client_batch_id, records_count, status)
       VALUES ($1, $2, $3, 'SUCCESS')`, [patientId, batchId, totalRecords]);
        return res.json({
            success: true,
            message: 'Offline batch synchronized successfully.',
            syncedSessionsCount,
            syncedLogsCount,
            batchId
        });
    }
    catch (error) {
        console.error('[syncBatch error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.syncBatch = syncBatch;
