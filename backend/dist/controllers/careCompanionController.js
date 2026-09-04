"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatientProgressReport = exports.getActionCenterAlerts = exports.addCaregiverNote = exports.getCaregiverNotes = exports.deleteFamilyMemory = exports.addFamilyMemory = exports.getFamilyMemories = exports.logWellnessActivity = exports.getWellnessActivities = exports.getMyDayOverview = void 0;
const db_1 = require("../config/db");
// Helper to resolve target patient ID with strict RBAC
async function resolveAuthorizedPatientId(req, requestedPatientId) {
    const user = req.user;
    if (!user)
        return null;
    if (user.role === 'ELDER') {
        // Elder can ONLY ever access their own data
        return user.id;
    }
    if (user.role === 'CAREGIVER') {
        if (!requestedPatientId)
            return null;
        // Verify assignment in caregiver_patient_links
        const linkRes = await (0, db_1.query)('SELECT id FROM caregiver_patient_links WHERE caregiver_id = $1 AND patient_id = $2', [user.id, requestedPatientId]);
        if (linkRes.rows.length === 0)
            return null;
        return requestedPatientId;
    }
    if (user.role === 'CLINICIAN' || user.role === 'ADMIN') {
        return requestedPatientId || null;
    }
    return null;
}
// 1. My Day Aggregated Overview
const getMyDayOverview = async (req, res) => {
    try {
        const patientId = await resolveAuthorizedPatientId(req, req.query.patientId);
        if (!patientId) {
            return res.status(403).json({ success: false, message: 'Unauthorized patient access or missing assignment.' });
        }
        // A. Reminders & execution logs for today
        const remsRes = await (0, db_1.query)(`
      SELECT r.id, r.title, r.type, r.scheduled_time, r.dosage_or_notes, r.medicine_name, r.dosage_text,
             COALESCE(rl.status, 'PENDING') as status, rl.acknowledged_at
      FROM reminders r
      LEFT JOIN reminder_logs rl ON r.id = rl.reminder_id AND rl.scheduled_date = CURRENT_DATE
      WHERE r.patient_id = $1 AND r.is_active = TRUE
      ORDER BY r.scheduled_time ASC
    `, [patientId]);
        const reminders = remsRes.rows;
        const meds = reminders.filter(r => r.type === 'MEDICATION');
        const hydration = reminders.filter(r => r.type === 'HYDRATION');
        const routine = reminders.filter(r => r.type === 'ROUTINE' || r.type === 'MEAL');
        const medStats = {
            total: meds.length,
            taken: meds.filter(m => m.status === 'TAKEN').length,
            pending: meds.filter(m => m.status === 'PENDING').length,
            missed: meds.filter(m => m.status === 'MISSED').length,
            snoozed: meds.filter(m => m.status === 'SNOOZED').length
        };
        // B. Cognitive activities played today
        const gamesRes = await (0, db_1.query)(`
      SELECT gs.id, gs.game_id, g.title, gs.score, gs.accuracy_percentage, gs.client_created_at
      FROM game_sessions gs
      JOIN games g ON gs.game_id = g.id
      WHERE gs.patient_id = $1 AND DATE(gs.client_created_at) = CURRENT_DATE
      ORDER BY gs.client_created_at DESC
    `, [patientId]);
        const cognitiveStats = {
            completedToday: gamesRes.rows.length > 0,
            sessionsCountToday: gamesRes.rows.length,
            todaySessions: gamesRes.rows
        };
        // C. Wellness activities logged today
        const wellRes = await (0, db_1.query)(`
      SELECT id, activity_type, duration_minutes, completed, notes, completed_at
      FROM wellness_activities
      WHERE patient_id = $1 AND DATE(completed_at) = CURRENT_DATE
      ORDER BY completed_at DESC
    `, [patientId]);
        const wellnessStats = {
            completedToday: wellRes.rows.length > 0,
            totalMinutesToday: wellRes.rows.reduce((sum, a) => sum + (a.duration_minutes || 0), 0),
            todayActivities: wellRes.rows
        };
        // D. Next upcoming reminder
        const nextItem = reminders.find(r => r.status === 'PENDING') || null;
        return res.json({
            success: true,
            patientId,
            myDay: {
                date: new Date().toISOString().split('T')[0],
                medication: medStats,
                hydration: {
                    total: hydration.length,
                    taken: hydration.filter(h => h.status === 'TAKEN').length,
                    pending: hydration.filter(h => h.status === 'PENDING').length
                },
                cognitive: cognitiveStats,
                wellness: wellnessStats,
                routine: {
                    total: routine.length,
                    completed: routine.filter(rt => rt.status === 'TAKEN').length,
                    pending: routine.filter(rt => rt.status === 'PENDING').length
                },
                nextUpcoming: nextItem,
                allTodayReminders: reminders
            }
        });
    }
    catch (error) {
        console.error('[getMyDayOverview error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyDayOverview = getMyDayOverview;
// 2. Wellness Activities (GET / POST)
const getWellnessActivities = async (req, res) => {
    try {
        const patientId = await resolveAuthorizedPatientId(req, req.query.patientId);
        if (!patientId) {
            return res.status(403).json({ success: false, message: 'Unauthorized patient access.' });
        }
        const result = await (0, db_1.query)(`
      SELECT id, activity_type, duration_minutes, completed, notes, completed_at, created_at
      FROM wellness_activities
      WHERE patient_id = $1
      ORDER BY completed_at DESC
      LIMIT 30
    `, [patientId]);
        // Calculate weekly totals
        const weeklyRes = await (0, db_1.query)(`
      SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes,
             COUNT(DISTINCT DATE(completed_at)) as active_days,
             COUNT(id) as total_activities
      FROM wellness_activities
      WHERE patient_id = $1 AND completed_at >= NOW() - INTERVAL '7 days'
    `, [patientId]);
        const weekly = weeklyRes.rows[0];
        return res.json({
            success: true,
            patientId,
            weeklySummary: {
                totalMinutes: parseInt(weekly.total_minutes, 10),
                activeDays: parseInt(weekly.active_days, 10),
                totalActivities: parseInt(weekly.total_activities, 10)
            },
            activities: result.rows
        });
    }
    catch (error) {
        console.error('[getWellnessActivities error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getWellnessActivities = getWellnessActivities;
const logWellnessActivity = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ success: false, message: 'Authentication required' });
        let targetPatientId = user.id;
        if (user.role === 'CAREGIVER') {
            targetPatientId = req.body.patientId;
            const valid = await resolveAuthorizedPatientId(req, targetPatientId);
            if (!valid)
                return res.status(403).json({ success: false, message: 'Unauthorized patient link' });
        }
        const { activityType, durationMinutes = 15, notes, completed = true } = req.body;
        if (!activityType) {
            return res.status(400).json({ success: false, message: 'Activity type is required (e.g. Walking, Stretching, Light Exercise).' });
        }
        const result = await (0, db_1.query)(`
      INSERT INTO wellness_activities (patient_id, activity_type, duration_minutes, completed, notes, completed_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [targetPatientId, activityType.trim(), parseInt(String(durationMinutes), 10) || 15, Boolean(completed), notes ? notes.trim() : null]);
        return res.status(201).json({
            success: true,
            message: 'Wellness activity logged successfully.',
            activity: result.rows[0]
        });
    }
    catch (error) {
        console.error('[logWellnessActivity error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.logWellnessActivity = logWellnessActivity;
// 3. Family Memory Vault CRUD
const getFamilyMemories = async (req, res) => {
    try {
        const patientId = await resolveAuthorizedPatientId(req, req.query.patientId);
        if (!patientId) {
            return res.status(403).json({ success: false, message: 'Unauthorized patient access.' });
        }
        const result = await (0, db_1.query)(`
      SELECT id, patient_id, member_name, relationship, photo_url, important_place, important_event, memory_text, created_at
      FROM family_memory_items
      WHERE patient_id = $1
      ORDER BY created_at DESC
    `, [patientId]);
        return res.json({
            success: true,
            patientId,
            memories: result.rows
        });
    }
    catch (error) {
        console.error('[getFamilyMemories error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getFamilyMemories = getFamilyMemories;
const addFamilyMemory = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ success: false, message: 'Authentication required' });
        let targetPatientId = user.id;
        if (user.role === 'CAREGIVER') {
            targetPatientId = req.body.patientId;
            const valid = await resolveAuthorizedPatientId(req, targetPatientId);
            if (!valid)
                return res.status(403).json({ success: false, message: 'Unauthorized patient link' });
        }
        const { memberName, relationship, photoUrl, importantPlace, importantEvent, memoryText } = req.body;
        if (!memberName || !relationship || !memoryText) {
            return res.status(400).json({ success: false, message: 'Member name, relationship, and memory description are required.' });
        }
        const result = await (0, db_1.query)(`
      INSERT INTO family_memory_items (patient_id, member_name, relationship, photo_url, important_place, important_event, memory_text)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [targetPatientId, memberName.trim(), relationship.trim(), photoUrl || null, importantPlace ? importantPlace.trim() : null, importantEvent ? importantEvent.trim() : null, memoryText.trim()]);
        return res.status(201).json({
            success: true,
            message: 'Family memory item added successfully.',
            memory: result.rows[0]
        });
    }
    catch (error) {
        console.error('[addFamilyMemory error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.addFamilyMemory = addFamilyMemory;
const deleteFamilyMemory = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (!user)
            return res.status(401).json({ success: false, message: 'Authentication required' });
        // Fetch memory to check ownership
        const itemRes = await (0, db_1.query)('SELECT patient_id FROM family_memory_items WHERE id = $1', [id]);
        if (itemRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Memory item not found.' });
        }
        const targetPatientId = itemRes.rows[0].patient_id;
        const valid = await resolveAuthorizedPatientId(req, targetPatientId);
        if (!valid)
            return res.status(403).json({ success: false, message: 'Unauthorized to delete memory.' });
        await (0, db_1.query)('DELETE FROM family_memory_items WHERE id = $1', [id]);
        return res.json({ success: true, message: 'Memory item deleted.' });
    }
    catch (error) {
        console.error('[deleteFamilyMemory error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteFamilyMemory = deleteFamilyMemory;
// 4. Caregiver Notes
const getCaregiverNotes = async (req, res) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'CAREGIVER') {
            return res.status(403).json({ success: false, message: 'Only caregivers can access observational notes.' });
        }
        const patientId = req.query.patientId;
        const valid = await resolveAuthorizedPatientId(req, patientId);
        if (!valid)
            return res.status(403).json({ success: false, message: 'Unauthorized patient access.' });
        const result = await (0, db_1.query)(`
      SELECT cn.id, cn.note_text, cn.created_at, u.full_name as author_name
      FROM caregiver_notes cn
      JOIN users u ON cn.caregiver_id = u.id
      WHERE cn.patient_id = $1
      ORDER BY cn.created_at DESC
    `, [patientId]);
        return res.json({ success: true, patientId, notes: result.rows });
    }
    catch (error) {
        console.error('[getCaregiverNotes error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCaregiverNotes = getCaregiverNotes;
const addCaregiverNote = async (req, res) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'CAREGIVER') {
            return res.status(403).json({ success: false, message: 'Only caregivers can record notes.' });
        }
        const { patientId, noteText } = req.body;
        if (!patientId || !noteText) {
            return res.status(400).json({ success: false, message: 'patientId and noteText are required.' });
        }
        const valid = await resolveAuthorizedPatientId(req, patientId);
        if (!valid)
            return res.status(403).json({ success: false, message: 'Unauthorized patient link.' });
        const result = await (0, db_1.query)(`
      INSERT INTO caregiver_notes (caregiver_id, patient_id, note_text)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [user.id, patientId, noteText.trim()]);
        return res.status(201).json({
            success: true,
            message: 'Caregiver note recorded successfully.',
            note: result.rows[0]
        });
    }
    catch (error) {
        console.error('[addCaregiverNote error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.addCaregiverNote = addCaregiverNote;
// 5. Caregiver Action Center
const getActionCenterAlerts = async (req, res) => {
    try {
        const user = req.user;
        if (!user || (user.role !== 'CAREGIVER' && user.role !== 'CLINICIAN' && user.role !== 'ADMIN')) {
            return res.status(403).json({ success: false, message: 'Unauthorized access to Action Center.' });
        }
        // Get assigned patients
        const patientsRes = await (0, db_1.query)(`
      SELECT p.id, p.full_name, p.ner_region, pp.status as trend_status, pp.baseline_activity_index
      FROM users p
      JOIN caregiver_patient_links cpl ON p.id = cpl.patient_id
      LEFT JOIN patient_profiles pp ON p.id = pp.user_id
      WHERE cpl.caregiver_id = $1
    `, [user.id]);
        const patients = patientsRes.rows;
        const alerts = [];
        for (const pat of patients) {
            // Missed reminders today
            const missedRes = await (0, db_1.query)(`
        SELECT COUNT(r.id) as count
        FROM reminders r
        JOIN reminder_logs rl ON r.id = rl.reminder_id
        WHERE r.patient_id = $1 AND rl.scheduled_date = CURRENT_DATE AND rl.status = 'MISSED'
      `, [pat.id]);
            const missedCount = parseInt(missedRes.rows[0]?.count || '0', 10);
            // Cognitive activity completed today?
            const cogRes = await (0, db_1.query)(`
        SELECT COUNT(id) as count
        FROM game_sessions
        WHERE patient_id = $1 AND DATE(client_created_at) = CURRENT_DATE
      `, [pat.id]);
            const cogCount = parseInt(cogRes.rows[0]?.count || '0', 10);
            // Wellness completed today?
            const wellRes = await (0, db_1.query)(`
        SELECT COUNT(id) as count
        FROM wellness_activities
        WHERE patient_id = $1 AND DATE(completed_at) = CURRENT_DATE
      `, [pat.id]);
            const wellCount = parseInt(wellRes.rows[0]?.count || '0', 10);
            if (missedCount > 0) {
                alerts.push({
                    patientId: pat.id,
                    patientName: pat.full_name,
                    type: 'MISSED_REMINDERS',
                    severity: 'HIGH',
                    message: `${missedCount} reminder(s) were missed today.`,
                    actionType: 'CHECK_REMINDERS'
                });
            }
            if (wellCount === 0) {
                alerts.push({
                    patientId: pat.id,
                    patientName: pat.full_name,
                    type: 'WELLNESS_PENDING',
                    severity: 'MEDIUM',
                    message: 'Daily wellness activity not yet logged.',
                    actionType: 'VIEW_WELLNESS'
                });
            }
            if (cogCount === 0) {
                alerts.push({
                    patientId: pat.id,
                    patientName: pat.full_name,
                    type: 'COGNITIVE_PENDING',
                    severity: 'LOW',
                    message: 'Recommended cognitive activity pending for today.',
                    actionType: 'VIEW_GAMES'
                });
            }
            if (pat.trend_status === 'PERFORMANCE_CHANGE_DETECTED') {
                alerts.push({
                    patientId: pat.id,
                    patientName: pat.full_name,
                    type: 'PERFORMANCE_CHANGE',
                    severity: 'MEDIUM',
                    message: 'Recent activity performance showed a noticeable change compared to baseline. Check hydration or rest.',
                    actionType: 'VIEW_REPORT'
                });
            }
        }
        return res.json({
            success: true,
            totalAlerts: alerts.length,
            assignedPatientsCount: patients.length,
            alerts
        });
    }
    catch (error) {
        console.error('[getActionCenterAlerts error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getActionCenterAlerts = getActionCenterAlerts;
// 6. Comprehensive Printable Patient Progress Report
const getPatientProgressReport = async (req, res) => {
    try {
        const { patientId } = req.params;
        const valid = await resolveAuthorizedPatientId(req, patientId);
        if (!valid) {
            return res.status(403).json({ success: false, message: 'Unauthorized access to patient progress report.' });
        }
        // A. Patient Info
        const pRes = await (0, db_1.query)(`
      SELECT u.id, u.full_name, u.email, u.phone_number, u.preferred_language, u.ner_region, u.age, u.gender,
             pp.emergency_contact_name, pp.emergency_contact_phone, pp.status as baseline_status, pp.baseline_activity_index
      FROM users u
      LEFT JOIN patient_profiles pp ON u.id = pp.user_id
      WHERE u.id = $1
    `, [patientId]);
        if (pRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Patient not found.' });
        }
        const patient = pRes.rows[0];
        // B. Cognitive Profile & 5 Domains
        const cpRes = await (0, db_1.query)('SELECT * FROM cognitive_profiles WHERE patient_id = $1', [patientId]);
        const cognitiveProfile = cpRes.rows[0] || null;
        // C. Cognitive Game Sessions (Last 30 days)
        const sessionsRes = await (0, db_1.query)(`
      SELECT gs.id, gs.game_id, g.title, g.primary_domain, gs.difficulty_level, gs.score,
             gs.accuracy_percentage, gs.average_reaction_time_ms, gs.duration_seconds, gs.client_created_at
      FROM game_sessions gs
      JOIN games g ON gs.game_id = g.id
      WHERE gs.patient_id = $1
      ORDER BY gs.client_created_at DESC
      LIMIT 50
    `, [patientId]);
        const sessions = sessionsRes.rows;
        const totalSessions = sessions.length;
        const avgAccuracy = totalSessions > 0
            ? parseFloat((sessions.reduce((s, x) => s + parseFloat(x.accuracy_percentage), 0) / totalSessions).toFixed(1))
            : 0;
        const avgRt = totalSessions > 0
            ? Math.round(sessions.reduce((s, x) => s + x.average_reaction_time_ms, 0) / totalSessions)
            : 0;
        // D. Medicine Adherence
        const medRes = await (0, db_1.query)(`
      SELECT 
        COUNT(CASE WHEN rl.status = 'TAKEN' THEN 1 END) as taken_count,
        COUNT(CASE WHEN rl.status = 'MISSED' THEN 1 END) as missed_count,
        COUNT(CASE WHEN rl.status = 'SNOOZED' THEN 1 END) as snoozed_count,
        COUNT(rl.id) as total_scheduled
      FROM reminders r
      JOIN reminder_logs rl ON r.id = rl.reminder_id
      WHERE r.patient_id = $1 AND r.type = 'MEDICATION' AND rl.scheduled_date >= CURRENT_DATE - INTERVAL '30 days'
    `, [patientId]);
        const medLog = medRes.rows[0];
        const totalMeds = parseInt(medLog.total_scheduled || '0', 10);
        const takenMeds = parseInt(medLog.taken_count || '0', 10);
        const medAdherence = totalMeds > 0 ? parseFloat(((takenMeds / totalMeds) * 100).toFixed(1)) : 100;
        // E. Routine Adherence
        const routRes = await (0, db_1.query)(`
      SELECT 
        COUNT(CASE WHEN rl.status = 'TAKEN' THEN 1 END) as completed_count,
        COUNT(rl.id) as total_scheduled
      FROM reminders r
      JOIN reminder_logs rl ON r.id = rl.reminder_id
      WHERE r.patient_id = $1 AND r.type != 'MEDICATION' AND rl.scheduled_date >= CURRENT_DATE - INTERVAL '30 days'
    `, [patientId]);
        const routLog = routRes.rows[0];
        const totalRout = parseInt(routLog.total_scheduled || '0', 10);
        const compRout = parseInt(routLog.completed_count || '0', 10);
        const routAdherence = totalRout > 0 ? parseFloat(((compRout / totalRout) * 100).toFixed(1)) : 100;
        // F. Wellness Summary
        const wellRes = await (0, db_1.query)(`
      SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes,
             COUNT(DISTINCT DATE(completed_at)) as active_days,
             COUNT(id) as total_activities
      FROM wellness_activities
      WHERE patient_id = $1 AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
    `, [patientId]);
        const wellSummary = wellRes.rows[0];
        // G. Caregiver Notes
        const notesRes = await (0, db_1.query)(`
      SELECT cn.note_text, cn.created_at, u.full_name as author_name
      FROM caregiver_notes cn
      JOIN users u ON cn.caregiver_id = u.id
      WHERE cn.patient_id = $1
      ORDER BY cn.created_at DESC
      LIMIT 5
    `, [patientId]);
        return res.json({
            success: true,
            report: {
                generatedAt: new Date().toISOString(),
                nonDiagnosticDisclaimer: 'This progress report is generated solely for personal wellness tracking, routine adherence, and cognitive engagement. It does not provide medical diagnosis, clinical prognosis, or clinical assessment.',
                patient,
                cognitiveProfile,
                cognitiveAnalytics: {
                    totalSessions,
                    averageAccuracyPercentage: avgAccuracy,
                    averageReactionTimeMs: avgRt,
                    recentSessions: sessions.slice(0, 10)
                },
                medicineAdherence: {
                    totalScheduled: totalMeds,
                    taken: takenMeds,
                    missed: parseInt(medLog.missed_count || '0', 10),
                    snoozed: parseInt(medLog.snoozed_count || '0', 10),
                    adherencePercentage: medAdherence
                },
                routineAdherence: {
                    totalScheduled: totalRout,
                    completed: compRout,
                    adherencePercentage: routAdherence
                },
                wellness: {
                    totalMinutesLast30Days: parseInt(wellSummary.total_minutes, 10),
                    activeDaysLast30Days: parseInt(wellSummary.active_days, 10),
                    totalActivitiesLogged: parseInt(wellSummary.total_activities, 10)
                },
                observationalNotes: notesRes.rows
            }
        });
    }
    catch (error) {
        console.error('[getPatientProgressReport error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPatientProgressReport = getPatientProgressReport;
