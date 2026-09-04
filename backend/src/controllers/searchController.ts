import { Request, Response } from 'express';
import { query } from '../config/db';

/**
 * Global Search Controller
 * Provides secure, RBAC-isolated application search:
 * - Elders can search active games, their own reminders, and activity guides.
 * - Caregivers can search their assigned patients, patient reminders, and games.
 * - Enforces strict tenant and role isolation: Elders never see other users;
 *   Caregivers only see patients explicitly assigned to them.
 */
export const searchGlobal = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId || !role) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const rawQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!rawQuery) {
      return res.json({
        success: true,
        query: '',
        results: {
          games: [],
          reminders: [],
          patients: []
        }
      });
    }

    const searchPattern = `%${rawQuery}%`;

    // 1. Search Cognitive Games (Available to all authenticated roles)
    const gamesRes = await query(
      `SELECT id, title, primary_domain as domain, description, min_difficulty, max_difficulty
       FROM games
       WHERE title ILIKE $1 OR description ILIKE $1 OR primary_domain::text ILIKE $1
       ORDER BY title ASC
       LIMIT 10`,
      [searchPattern]
    );

    let reminders: any[] = [];
    let patients: any[] = [];
    let wellness: any[] = [];
    let familyMemories: any[] = [];

    // 2. Elder Search: Only searches Elder's own active reminders, wellness, and family memories
    if (role === 'ELDER') {
      const remRes = await query(
        `SELECT id, title, type, scheduled_time, dosage_or_notes, is_active
         FROM reminders
         WHERE patient_id = $1 AND is_active = TRUE
           AND (title ILIKE $2 OR dosage_or_notes ILIKE $2 OR type::text ILIKE $2 OR medicine_name ILIKE $2)
         ORDER BY scheduled_time ASC
         LIMIT 10`,
        [userId, searchPattern]
      );
      reminders = remRes.rows;

      const wellRes = await query(
        `SELECT id, activity_type, duration_minutes, completed_at, notes
         FROM wellness_activities
         WHERE patient_id = $1 AND (activity_type ILIKE $2 OR notes ILIKE $2)
         ORDER BY completed_at DESC
         LIMIT 5`,
        [userId, searchPattern]
      );
      wellness = wellRes.rows;

      const famRes = await query(
        `SELECT id, member_name, relationship, important_place, important_event, memory_text
         FROM family_memory_items
         WHERE patient_id = $1
           AND (member_name ILIKE $2 OR relationship ILIKE $2 OR important_place ILIKE $2 OR memory_text ILIKE $2)
         ORDER BY created_at DESC
         LIMIT 5`,
        [userId, searchPattern]
      );
      familyMemories = famRes.rows;

      // Strictly prevent patient list leakage to Elder
      patients = [];
    }

    // 3. Caregiver Search: ONLY searches assigned patients, patient reminders, and memories
    else if (role === 'CAREGIVER') {
      const patRes = await query(
        `SELECT u.id as patient_id,
                u.full_name,
                u.email,
                u.phone_number,
                l.relationship,
                p.status as activity_status,
                c.overall_performance_score
         FROM caregiver_patient_links l
         JOIN users u ON l.patient_id = u.id
         LEFT JOIN patient_profiles p ON u.id = p.user_id
         LEFT JOIN cognitive_profiles c ON u.id = c.patient_id
         WHERE l.caregiver_id = $1
           AND (u.full_name ILIKE $2 OR u.email ILIKE $2 OR l.relationship ILIKE $2)
         ORDER BY u.full_name ASC
         LIMIT 10`,
        [userId, searchPattern]
      );
      patients = patRes.rows;

      // Caregiver can also search reminders belonging to assigned patients
      const remRes = await query(
        `SELECT r.id,
                r.patient_id,
                u.full_name as patient_name,
                r.title,
                r.type,
                r.scheduled_time,
                r.dosage_or_notes
         FROM reminders r
         JOIN caregiver_patient_links l ON r.patient_id = l.patient_id
         JOIN users u ON r.patient_id = u.id
         WHERE l.caregiver_id = $1 AND r.is_active = TRUE
           AND (r.title ILIKE $2 OR r.dosage_or_notes ILIKE $2 OR u.full_name ILIKE $2)
         ORDER BY r.scheduled_time ASC
         LIMIT 10`,
        [userId, searchPattern]
      );
      reminders = remRes.rows;

      const famRes = await query(
        `SELECT f.id, f.patient_id, u.full_name as patient_name, f.member_name, f.relationship, f.important_place, f.memory_text
         FROM family_memory_items f
         JOIN caregiver_patient_links l ON f.patient_id = l.patient_id
         JOIN users u ON f.patient_id = u.id
         WHERE l.caregiver_id = $1
           AND (f.member_name ILIKE $2 OR f.relationship ILIKE $2 OR f.memory_text ILIKE $2 OR u.full_name ILIKE $2)
         ORDER BY f.created_at DESC
         LIMIT 5`,
        [userId, searchPattern]
      );
      familyMemories = famRes.rows;
    }

    // 4. Clinician & Admin Search: Broad clinical scope
    else if (role === 'CLINICIAN' || role === 'ADMIN') {
      const patRes = await query(
        `SELECT u.id as patient_id,
                u.full_name,
                u.email,
                u.phone_number,
                p.status as activity_status,
                c.overall_performance_score
         FROM users u
         LEFT JOIN patient_profiles p ON u.id = p.user_id
         LEFT JOIN cognitive_profiles c ON u.id = c.patient_id
         WHERE u.role = 'ELDER'
           AND (u.full_name ILIKE $1 OR u.email ILIKE $1)
         ORDER BY u.full_name ASC
         LIMIT 10`,
        [searchPattern]
      );
      patients = patRes.rows;
    }

    return res.json({
      success: true,
      query: rawQuery,
      results: {
        games: gamesRes.rows,
        reminders,
        patients,
        wellness,
        familyMemories
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
