import { Request, Response } from 'express';
import { query } from '../config/db';
import { AiServiceClient } from '../services/aiServiceClient';

export const getGames = async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM games ORDER BY title ASC');
    return res.json({ success: true, games: result.rows });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getGameState = async (req: Request, res: Response) => {
  try {
    const patientId = req.params.patientId || req.user?.id;
    const gameId = req.params.gameId;

    const result = await query(
      `SELECT * FROM player_game_difficulty_states 
       WHERE patient_id = $1 AND game_id = $2`,
      [patientId, gameId]
    );

    if (result.rows.length === 0) {
      // Default to level 1
      return res.json({
        success: true,
        state: {
          patient_id: patientId,
          game_id: gameId,
          current_difficulty: 1,
          consecutive_successes: 0,
          consecutive_struggles: 0,
          ai_adjustment_notes: 'Starting at baseline difficulty level 1.'
        }
      });
    }

    return res.json({ success: true, state: result.rows[0] });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const recordSession = async (req: Request, res: Response) => {
  try {
    const patientId = req.user?.id;
    const {
      gameId,
      difficultyLevel,
      durationSeconds,
      score,
      accuracyPercentage,
      averageReactionTimeMs,
      mistakesCount = 0,
      consecutiveCorrect = 0,
      trials = [],
      telemetryPayload = {}
    } = req.body;

    if (!patientId || !gameId || difficultyLevel === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required session parameters.' });
    }

    // 1. Persist raw session telemetry to PostgreSQL
    const sessionRes = await query(
      `INSERT INTO game_sessions 
       (patient_id, game_id, difficulty_level, duration_seconds, score, accuracy_percentage, average_reaction_time_ms, mistakes_count, consecutive_correct, telemetry_payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, patient_id, game_id, difficulty_level, duration_seconds, score, accuracy_percentage, average_reaction_time_ms, client_created_at`,
      [
        patientId,
        gameId,
        difficultyLevel,
        durationSeconds,
        score,
        accuracyPercentage,
        averageReactionTimeMs,
        mistakesCount,
        consecutiveCorrect,
        JSON.stringify(telemetryPayload)
      ]
    );
    const savedSession = sessionRes.rows[0];

    // 2. Fetch current cognitive profile from DB
    const profileRes = await query(
      `SELECT * FROM cognitive_profiles WHERE patient_id = $1`,
      [patientId]
    );
    const currentProfile = profileRes.rows[0] || {
      working_memory_score: 50.0,
      processing_speed_score: 50.0,
      attention_score: 50.0,
      executive_flexibility_score: 50.0,
      reminiscence_score: 50.0,
      overall_performance_score: 50.0,
      consistency_index: 75.0,
      engagement_minutes_total: 0
    };

    // 3. Call Python AI Service for real DDA & domain profile update
    const aiEvaluation = await AiServiceClient.evaluateSession(
      {
        patient_id: patientId,
        game_id: gameId,
        difficulty_level: difficultyLevel,
        duration_seconds: durationSeconds,
        score: score,
        accuracy_percentage: accuracyPercentage,
        average_reaction_time_ms: averageReactionTimeMs,
        mistakes_count: mistakesCount,
        consecutive_correct: consecutiveCorrect,
        trials: trials
      },
      currentProfile
    );

    // 4. Update player_game_difficulty_states with AI DDA output
    const nextDiff = aiEvaluation.dda.next_difficulty;
    const adjustmentNotes = aiEvaluation.dda.rationale;
    await query(
      `INSERT INTO player_game_difficulty_states (patient_id, game_id, current_difficulty, ai_adjustment_notes, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (patient_id, game_id)
       DO UPDATE SET current_difficulty = $3, ai_adjustment_notes = $4, updated_at = NOW()`,
      [patientId, gameId, nextDiff, adjustmentNotes]
    );

    // 5. Update cognitive_profiles with new 5-domain scores & engagement minutes
    const addedMinutes = Math.max(1, Math.round(durationSeconds / 60));
    const newTotalMinutes = (currentProfile.engagement_minutes_total || 0) + addedMinutes;
    const updatedDomains = aiEvaluation.domain_scores_updated;

    await query(
      `UPDATE cognitive_profiles
       SET overall_performance_score = $1,
           working_memory_score = $2,
           processing_speed_score = $3,
           attention_score = $4,
           executive_flexibility_score = $5,
           reminiscence_score = $6,
           consistency_index = $7,
           engagement_minutes_total = $8,
           last_evaluated_at = NOW()
       WHERE patient_id = $9`,
      [
        updatedDomains.overall_performance_score,
        updatedDomains.working_memory_score,
        updatedDomains.processing_speed_score,
        updatedDomains.attention_score,
        updatedDomains.executive_flexibility_score,
        updatedDomains.reminiscence_score,
        aiEvaluation.consistency_index,
        newTotalMinutes,
        patientId
      ]
    );

    // 6. Check for performance changes using recent 5 sessions
    const recentSessionsRes = await query(
      `SELECT game_id, accuracy_percentage, average_reaction_time_ms, mistakes_count, score, duration_seconds
       FROM game_sessions
       WHERE patient_id = $1
       ORDER BY client_created_at DESC LIMIT 5`,
      [patientId]
    );

    const patientProfileRes = await query(
      `SELECT baseline_activity_index FROM patient_profiles WHERE user_id = $1`,
      [patientId]
    );
    const baselineIndex = parseFloat(patientProfileRes.rows[0]?.baseline_activity_index || '50.0');

    const changeAnalysis = await AiServiceClient.detectChange(
      patientId,
      baselineIndex,
      recentSessionsRes.rows
    );

    // Update patient status in DB
    await query(
      `UPDATE patient_profiles SET status = $1 WHERE user_id = $2`,
      [changeAnalysis.status, patientId]
    );

    if (changeAnalysis.performance_change_flag) {
      await query(
        `UPDATE cognitive_profiles 
         SET performance_change_flag = TRUE, performance_change_notes = $1 
         WHERE patient_id = $2`,
        [changeAnalysis.notes, patientId]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Game session telemetry processed successfully.',
      session: savedSession,
      dda: aiEvaluation.dda,
      updatedDomains,
      consistencyIndex: aiEvaluation.consistency_index,
      performanceChangeStatus: changeAnalysis.status
    });
  } catch (error: any) {
    console.error('[GameSession recordSession error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
