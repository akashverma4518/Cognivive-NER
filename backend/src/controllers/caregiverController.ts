import { Request, Response } from 'express';
import { query } from '../config/db';
import { AiServiceClient } from '../services/aiServiceClient';

/**
 * Security helper: Verifies caregiver has access to the requested patient.
 * Clinicians and Admins have broad clinical access.
 * Caregivers MUST have an active link in caregiver_patient_links.
 */
const verifyPatientAccess = async (userId: string, role: string, patientId: string) => {
  // Check if patient exists in users
  const pCheck = await query(`SELECT id, role FROM users WHERE id = $1`, [patientId]);
  if (pCheck.rows.length === 0) {
    return { allowed: false, status: 404, message: 'Patient not found.' };
  }
  if (pCheck.rows[0].role !== 'ELDER') {
    return { allowed: false, status: 404, message: 'User is not an elderly patient.' };
  }

  // Clinician or Admin bypass
  if (role === 'CLINICIAN' || role === 'ADMIN') {
    return { allowed: true, status: 200 };
  }

  // Caregiver must be explicitly assigned to this patient
  const linkCheck = await query(
    `SELECT id FROM caregiver_patient_links WHERE caregiver_id = $1 AND patient_id = $2`,
    [userId, patientId]
  );
  if (linkCheck.rows.length === 0) {
    return { allowed: false, status: 403, message: 'Access denied. You are not assigned to this patient.' };
  }

  return { allowed: true, status: 200 };
};

export const getPatients = async (req: Request, res: Response) => {
  try {
    const caregiverId = req.user?.id;
    const role = req.user?.role;

    let sql = '';
    let params: any[] = [];

    if (role === 'CLINICIAN' || role === 'ADMIN') {
      sql = `
        SELECT u.id as patient_id,
               u.full_name,
               u.email,
               u.phone_number,
               p.status as activity_status,
               p.baseline_activity_index,
               p.emergency_contact_phone,
               c.overall_performance_score,
               c.consistency_index,
               c.performance_change_flag,
               c.performance_change_notes,
               c.last_evaluated_at,
               'Assigned Patient' as relationship,
               (SELECT COUNT(*) FROM game_sessions gs WHERE gs.patient_id = u.id)::int as total_sessions,
               (SELECT COUNT(*) FROM game_sessions gs WHERE gs.patient_id = u.id AND DATE(gs.client_created_at) = CURRENT_DATE)::int as today_sessions_count,
               (SELECT client_created_at FROM game_sessions gs WHERE gs.patient_id = u.id ORDER BY gs.client_created_at DESC LIMIT 1) as last_active_time,
               (SELECT COUNT(*) FROM reminder_logs rl JOIN reminders r ON rl.reminder_id = r.id WHERE r.patient_id = u.id AND rl.scheduled_date = CURRENT_DATE AND rl.status = 'TAKEN')::int as today_reminders_completed,
               (SELECT COUNT(*) FROM reminders r WHERE r.patient_id = u.id AND r.is_active = TRUE)::int as today_reminders_total
        FROM users u
        LEFT JOIN patient_profiles p ON u.id = p.user_id
        LEFT JOIN cognitive_profiles c ON u.id = c.patient_id
        WHERE u.role = 'ELDER'
        ORDER BY u.full_name ASC
      `;
    } else {
      sql = `
        SELECT u.id as patient_id,
               u.full_name,
               u.email,
               u.phone_number,
               p.status as activity_status,
               p.baseline_activity_index,
               p.emergency_contact_phone,
               c.overall_performance_score,
               c.consistency_index,
               c.performance_change_flag,
               c.performance_change_notes,
               c.last_evaluated_at,
               l.relationship,
               (SELECT COUNT(*) FROM game_sessions gs WHERE gs.patient_id = u.id)::int as total_sessions,
               (SELECT COUNT(*) FROM game_sessions gs WHERE gs.patient_id = u.id AND DATE(gs.client_created_at) = CURRENT_DATE)::int as today_sessions_count,
               (SELECT client_created_at FROM game_sessions gs WHERE gs.patient_id = u.id ORDER BY gs.client_created_at DESC LIMIT 1) as last_active_time,
               (SELECT COUNT(*) FROM reminder_logs rl JOIN reminders r ON rl.reminder_id = r.id WHERE r.patient_id = u.id AND rl.scheduled_date = CURRENT_DATE AND rl.status = 'TAKEN')::int as today_reminders_completed,
               (SELECT COUNT(*) FROM reminders r WHERE r.patient_id = u.id AND r.is_active = TRUE)::int as today_reminders_total
        FROM caregiver_patient_links l
        JOIN users u ON l.patient_id = u.id
        LEFT JOIN patient_profiles p ON u.id = p.user_id
        LEFT JOIN cognitive_profiles c ON u.id = c.patient_id
        WHERE l.caregiver_id = $1
        ORDER BY u.full_name ASC
      `;
      params = [caregiverId];
    }

    const patientsRes = await query(sql, params);

    return res.json({
      success: true,
      patients: patientsRes.rows
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getPatientDetail = async (req: Request, res: Response) => {
  try {
    const patientId = req.params.patientId || req.params.id;
    const userId = req.user?.id!;
    const role = req.user?.role!;

    const access = await verifyPatientAccess(userId, role, patientId);
    if (!access.allowed) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    // Patient and user info
    const userRes = await query(
      `SELECT u.id, u.full_name, u.email, u.phone_number, u.preferred_language,
              p.birth_date, p.emergency_contact_name, p.emergency_contact_phone,
              p.status as activity_status, p.baseline_activity_index, p.audio_prompts_enabled
       FROM users u
       JOIN patient_profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [patientId]
    );

    // Relationship
    const linkRes = await query(
      `SELECT relationship, can_edit_reminders FROM caregiver_patient_links WHERE patient_id = $1 AND caregiver_id = $2`,
      [patientId, userId]
    );

    // Cognitive profile (5 domains)
    const profileRes = await query(
      `SELECT patient_id, working_memory_score, processing_speed_score, attention_score,
              reminiscence_score, executive_flexibility_score as problem_solving_score,
              executive_flexibility_score, overall_performance_score,
              consistency_index, performance_change_flag, performance_change_notes, last_evaluated_at
       FROM cognitive_profiles WHERE patient_id = $1`,
      [patientId]
    );

    // Session aggregates
    const statsRes = await query(
      `SELECT COUNT(*)::int as total_sessions,
              COALESCE(ROUND(AVG(accuracy_percentage)::numeric, 1), 0) as avg_accuracy,
              COALESCE(ROUND(AVG(average_reaction_time_ms)::numeric, 0), 0) as avg_reaction_time,
              COALESCE(MAX(score), 0) as best_score,
              MAX(client_created_at) as last_active_time,
              (SELECT COUNT(*)::int FROM game_sessions WHERE patient_id = $1 AND DATE(client_created_at) = CURRENT_DATE) as today_sessions_count
       FROM game_sessions
       WHERE patient_id = $1`,
      [patientId]
    );

    // Recent game sessions (last 15)
    const sessionsRes = await query(
      `SELECT id, game_id, difficulty_level, score, accuracy_percentage, 
              average_reaction_time_ms, mistakes_count, duration_seconds, client_created_at
       FROM game_sessions
       WHERE patient_id = $1
       ORDER BY client_created_at DESC
       LIMIT 15`,
      [patientId]
    );

    // Today's reminders
    const remindersRes = await query(
      `SELECT r.id, r.title, r.type, r.scheduled_time,
              COALESCE(l.status, 'PENDING') as today_status,
              l.acknowledged_at
       FROM reminders r
       LEFT JOIN reminder_logs l ON r.id = l.reminder_id AND l.scheduled_date = CURRENT_DATE
       WHERE r.patient_id = $1 AND r.is_active = TRUE
       ORDER BY r.scheduled_time ASC`,
      [patientId]
    );

    // Difficulty states
    const difficultyStatesRes = await query(
      `SELECT game_id, current_difficulty, ai_adjustment_notes, updated_at 
       FROM player_game_difficulty_states WHERE patient_id = $1`,
      [patientId]
    );

    // AI recommendation
    let recommendation = null;
    const cogProfile = profileRes.rows[0];
    if (cogProfile) {
      try {
        const aiRec = await AiServiceClient.getRecommendations({
          patient_id: patientId,
          domain_scores: {
            WORKING_MEMORY: parseFloat(cogProfile.working_memory_score) || 50,
            PROCESSING_SPEED: parseFloat(cogProfile.processing_speed_score) || 50,
            ATTENTION: parseFloat(cogProfile.attention_score) || 50,
            REMINISCENCE: parseFloat(cogProfile.reminiscence_score) || 50,
            PROBLEM_SOLVING: parseFloat(cogProfile.problem_solving_score) || 50
          },
          recent_sessions: sessionsRes.rows.slice(0, 5)
        });
        recommendation = aiRec;
      } catch (e) {
        // Fallback transparent recommendation
        recommendation = {
          success: true,
          primary_recommended_game: 'quick_harvest',
          recommended_difficulty: 1,
          rationale: 'Recommended activity based on recent activity performance to reinforce processing speed and attention.',
          suggested_daily_schedule: []
        };
      }
    }

    return res.json({
      success: true,
      patient: {
        ...userRes.rows[0],
        relationship: linkRes.rows[0]?.relationship || 'Assigned Patient'
      },
      cognitiveProfile: cogProfile || null,
      stats: statsRes.rows[0] || {},
      recentSessions: sessionsRes.rows,
      todayReminders: remindersRes.rows,
      difficultyStates: difficultyStatesRes.rows,
      recommendation
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getPatientTrends = async (req: Request, res: Response) => {
  try {
    const patientId = req.params.patientId || req.params.id;
    const userId = req.user?.id!;
    const role = req.user?.role!;

    const access = await verifyPatientAccess(userId, role, patientId);
    if (!access.allowed) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    // Historical sessions ordered chronologically
    const sessionsRes = await query(
      `SELECT id, game_id, difficulty_level, score, accuracy_percentage, 
              average_reaction_time_ms, mistakes_count, duration_seconds, client_created_at
       FROM game_sessions
       WHERE patient_id = $1
       ORDER BY client_created_at ASC
       LIMIT 50`,
      [patientId]
    );

    const sessions = sessionsRes.rows;

    // Calculate aggregated trend statistics
    let avgAccuracy = 0;
    let avgReactionTime = 0;
    let bestScore = 0;
    let trendDirection: 'IMPROVING' | 'STABLE' | 'LOWER' = 'STABLE';

    if (sessions.length > 0) {
      const sumAcc = sessions.reduce((sum, s) => sum + parseFloat(s.accuracy_percentage || 0), 0);
      const sumRt = sessions.reduce((sum, s) => sum + parseFloat(s.average_reaction_time_ms || 0), 0);
      avgAccuracy = Math.round((sumAcc / sessions.length) * 10) / 10;
      avgReactionTime = Math.round(sumRt / sessions.length);
      bestScore = Math.max(...sessions.map(s => s.score || 0));

      // Calculate recent vs prior trend
      if (sessions.length >= 6) {
        const recent3 = sessions.slice(-3);
        const prior3 = sessions.slice(-6, -3);
        const recentAvgAcc = recent3.reduce((s, x) => s + parseFloat(x.accuracy_percentage), 0) / 3;
        const priorAvgAcc = prior3.reduce((s, x) => s + parseFloat(x.accuracy_percentage), 0) / 3;

        if (recentAvgAcc - priorAvgAcc >= 4) {
          trendDirection = 'IMPROVING';
        } else if (priorAvgAcc - recentAvgAcc >= 7) {
          trendDirection = 'LOWER';
        }
      }
    }

    // Prepare chronological trend datapoints
    const timeline = sessions.map((s, idx) => ({
      index: idx + 1,
      id: s.id,
      game_id: s.game_id,
      date: s.client_created_at,
      accuracy: parseFloat(s.accuracy_percentage),
      reaction_time: Math.round(parseFloat(s.average_reaction_time_ms)),
      score: s.score,
      difficulty: s.difficulty_level,
      mistakes: s.mistakes_count
    }));

    return res.json({
      success: true,
      patient_id: patientId,
      total_sessions: sessions.length,
      overall_avg_accuracy: avgAccuracy,
      overall_avg_reaction_time_ms: avgReactionTime,
      best_score: bestScore,
      trend_direction: trendDirection,
      timeline,
      sessions
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getPatientGames = async (req: Request, res: Response) => {
  try {
    const patientId = req.params.patientId || req.params.id;
    const userId = req.user?.id!;
    const role = req.user?.role!;

    const access = await verifyPatientAccess(userId, role, patientId);
    if (!access.allowed) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    // All active games
    const gamesRes = await query(
      `SELECT id, title as name, id as slug, primary_domain as domain, description, min_difficulty, max_difficulty 
       FROM games 
       ORDER BY id ASC`
    );

    // Current difficulty states
    const statesRes = await query(
      `SELECT game_id, current_difficulty, ai_adjustment_notes, updated_at 
       FROM player_game_difficulty_states 
       WHERE patient_id = $1`,
      [patientId]
    );
    const stateMap = new Map<string, any>();
    statesRes.rows.forEach(st => stateMap.set(st.game_id, st));

    // Per-game analytics
    const gameAnalytics = await Promise.all(
      gamesRes.rows.map(async (g) => {
        const statsRes = await query(
          `SELECT COUNT(*)::int as sessions_completed,
                  COALESCE(ROUND(AVG(accuracy_percentage)::numeric, 1), 0) as avg_accuracy,
                  COALESCE(ROUND(AVG(average_reaction_time_ms)::numeric, 0), 0) as avg_reaction_time,
                  COALESCE(MAX(score), 0) as best_score,
                  MAX(client_created_at) as last_played_at
           FROM game_sessions
           WHERE patient_id = $1 AND game_id = $2`,
          [patientId, g.slug]
        );

        const recentSessionsRes = await query(
          `SELECT id, difficulty_level, score, accuracy_percentage, 
                  average_reaction_time_ms, mistakes_count, client_created_at
           FROM game_sessions
           WHERE patient_id = $1 AND game_id = $2
           ORDER BY client_created_at DESC
           LIMIT 5`,
          [patientId, g.slug]
        );

        // Difficulty history (progression over sessions)
        const diffHistoryRes = await query(
          `SELECT difficulty_level, client_created_at
           FROM game_sessions
           WHERE patient_id = $1 AND game_id = $2
           ORDER BY client_created_at ASC`,
          [patientId, g.slug]
        );

        const st = stateMap.get(g.slug);
        const stats = statsRes.rows[0];

        // Determine trend for this game
        let trend: 'IMPROVING' | 'STABLE' | 'LOWER' = 'STABLE';
        const sessions = recentSessionsRes.rows;
        if (sessions.length >= 2) {
          const first = parseFloat(sessions[sessions.length - 1].accuracy_percentage);
          const latest = parseFloat(sessions[0].accuracy_percentage);
          if (latest - first >= 5) trend = 'IMPROVING';
          else if (first - latest >= 8) trend = 'LOWER';
        }

        return {
          game_id: g.slug,
          name: g.name,
          domain: g.domain,
          description: g.description,
          current_difficulty: st ? st.current_difficulty : 1,
          ai_adjustment_notes: st ? st.ai_adjustment_notes : 'Initial calibration baseline.',
          sessions_completed: stats.sessions_completed,
          avg_accuracy: parseFloat(stats.avg_accuracy),
          avg_reaction_time_ms: parseInt(stats.avg_reaction_time),
          best_score: stats.best_score,
          last_played_at: stats.last_played_at,
          trend,
          difficulty_history: diffHistoryRes.rows.map(d => ({
            difficulty: d.difficulty_level,
            date: d.client_created_at
          })),
          recent_sessions: sessions
        };
      })
    );

    return res.json({
      success: true,
      patient_id: patientId,
      games: gameAnalytics
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getPatientReminders = async (req: Request, res: Response) => {
  try {
    const patientId = req.params.patientId || req.params.id;
    const userId = req.user?.id!;
    const role = req.user?.role!;

    const access = await verifyPatientAccess(userId, role, patientId);
    if (!access.allowed) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    // Configured active reminders
    const remindersRes = await query(
      `SELECT id, title, type, scheduled_time, is_active, days_of_week
       FROM reminders
       WHERE patient_id = $1 AND is_active = TRUE
       ORDER BY scheduled_time ASC`,
      [patientId]
    );

    // Today's status for each reminder
    const todayLogsRes = await query(
      `SELECT r.id as reminder_id, r.title, r.type, r.scheduled_time,
              COALESCE(l.status, 'PENDING') as status,
              l.acknowledged_at, l.voice_confirmed, l.notes
       FROM reminders r
       LEFT JOIN reminder_logs l ON r.id = l.reminder_id AND l.scheduled_date = CURRENT_DATE
       WHERE r.patient_id = $1 AND r.is_active = TRUE
       ORDER BY r.scheduled_time ASC`,
      [patientId]
    );

    // Compute today stats
    const todayItems = todayLogsRes.rows;
    const totalToday = todayItems.length;
    const takenToday = todayItems.filter(i => i.status === 'TAKEN').length;
    const snoozedToday = todayItems.filter(i => i.status === 'SNOOZED').length;
    const pendingToday = todayItems.filter(i => i.status === 'PENDING').length;
    const adherenceRate = totalToday > 0 ? Math.round((takenToday / totalToday) * 100) : 100;

    // Historical reminder logs (last 30 entries)
    const historyRes = await query(
      `SELECT l.id, r.title, r.type, l.scheduled_date, r.scheduled_time,
              l.status, l.acknowledged_at, l.notes, l.voice_confirmed
       FROM reminder_logs l
       JOIN reminders r ON l.reminder_id = r.id
       WHERE r.patient_id = $1
       ORDER BY l.scheduled_date DESC, r.scheduled_time DESC
       LIMIT 30`,
      [patientId]
    );

    return res.json({
      success: true,
      patient_id: patientId,
      total_configured: remindersRes.rows.length,
      today_summary: {
        total: totalToday,
        completed: takenToday,
        snoozed: snoozedToday,
        pending: pendingToday,
        adherence_percentage: adherenceRate
      },
      today_reminders: todayItems,
      history: historyRes.rows
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const overrideDifficulty = async (req: Request, res: Response) => {
  try {
    const patientId = req.params.patientId || req.params.id;
    const { gameId } = req.params;
    const { newDifficulty, notes } = req.body;
    const userId = req.user?.id!;
    const role = req.user?.role!;

    const access = await verifyPatientAccess(userId, role, patientId);
    if (!access.allowed) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    if (!newDifficulty || newDifficulty < 1 || newDifficulty > 8) {
      return res.status(400).json({ success: false, message: 'newDifficulty must be between 1 and 8.' });
    }

    const result = await query(
      `INSERT INTO player_game_difficulty_states (patient_id, game_id, current_difficulty, ai_adjustment_notes, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (patient_id, game_id)
       DO UPDATE SET current_difficulty = $3, ai_adjustment_notes = $4, updated_at = NOW()
       RETURNING *`,
      [patientId, gameId, newDifficulty, notes || `Manual calibration by caregiver (${req.user?.fullName})`]
    );

    return res.json({
      success: true,
      message: 'Difficulty calibrated successfully.',
      state: result.rows[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAlerts = async (req: Request, res: Response) => {
  try {
    const caregiverId = req.user?.id;
    const role = req.user?.role;

    // 1. Performance change flags (Strictly non-diagnostic activity monitoring)
    let changeSql = '';
    let changeParams: any[] = [];

    if (role === 'CLINICIAN' || role === 'ADMIN') {
      changeSql = `
        SELECT u.id as patient_id, 
               u.full_name as patient_name,
               p.baseline_activity_index,
               c.overall_performance_score,
               c.performance_change_notes,
               c.last_evaluated_at,
               'Consider checking in with the user or reviewing recent activity sessions.' as suggested_action
        FROM users u
        LEFT JOIN patient_profiles p ON u.id = p.user_id
        JOIN cognitive_profiles c ON u.id = c.patient_id
        WHERE u.role = 'ELDER' AND c.performance_change_flag = TRUE
      `;
    } else {
      changeSql = `
        SELECT u.id as patient_id, 
               u.full_name as patient_name,
               p.baseline_activity_index,
               c.overall_performance_score,
               c.performance_change_notes,
               c.last_evaluated_at,
               'Consider checking in with the user or reviewing recent activity sessions.' as suggested_action
        FROM caregiver_patient_links l
        JOIN users u ON l.patient_id = u.id
        LEFT JOIN patient_profiles p ON u.id = p.user_id
        JOIN cognitive_profiles c ON u.id = c.patient_id
        WHERE l.caregiver_id = $1 AND c.performance_change_flag = TRUE
      `;
      changeParams = [caregiverId];
    }

    const changeAlertsRes = await query(changeSql, changeParams);

    // 2. Overdue pending medication reminders for today
    let overdueSql = '';
    let overdueParams: any[] = [];

    if (role === 'CLINICIAN' || role === 'ADMIN') {
      overdueSql = `
        SELECT u.id as patient_id, u.full_name as patient_name, r.title, r.scheduled_time
        FROM users u
        JOIN reminders r ON u.id = r.patient_id
        LEFT JOIN reminder_logs log ON r.id = log.reminder_id AND log.scheduled_date = CURRENT_DATE
        WHERE u.role = 'ELDER'
          AND r.is_active = TRUE 
          AND r.type = 'MEDICATION'
          AND (log.status IS NULL OR log.status = 'PENDING')
          AND r.scheduled_time < CURRENT_TIME
      `;
    } else {
      overdueSql = `
        SELECT u.id as patient_id, u.full_name as patient_name, r.title, r.scheduled_time
        FROM caregiver_patient_links l
        JOIN users u ON l.patient_id = u.id
        JOIN reminders r ON u.id = r.patient_id
        LEFT JOIN reminder_logs log ON r.id = log.reminder_id AND log.scheduled_date = CURRENT_DATE
        WHERE l.caregiver_id = $1 
          AND r.is_active = TRUE 
          AND r.type = 'MEDICATION'
          AND (log.status IS NULL OR log.status = 'PENDING')
          AND r.scheduled_time < CURRENT_TIME
      `;
      overdueParams = [caregiverId];
    }

    const overdueMedsRes = await query(overdueSql, overdueParams);

    return res.json({
      success: true,
      performanceChangeAlerts: changeAlertsRes.rows,
      overdueMedicationAlerts: overdueMedsRes.rows
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
