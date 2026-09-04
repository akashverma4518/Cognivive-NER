import { Request, Response } from 'express';
import { query } from '../config/db';

export const getTodayReminders = async (req: Request, res: Response) => {
  try {
    const patientId = req.query.patientId as string || req.user?.id;

    // Get all active reminders for patient
    const remindersRes = await query(
      `SELECT r.*, 
              COALESCE(l.status, 'PENDING') as today_status,
              l.acknowledged_at,
              l.voice_confirmed
       FROM reminders r
       LEFT JOIN reminder_logs l 
         ON r.id = l.reminder_id AND l.scheduled_date = CURRENT_DATE
       WHERE r.patient_id = $1 AND r.is_active = TRUE
       ORDER BY r.scheduled_time ASC`,
      [patientId]
    );

    return res.json({
      success: true,
      reminders: remindersRes.rows
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const acknowledgeReminder = async (req: Request, res: Response) => {
  try {
    const patientId = req.user?.id;
    const reminderId = req.params.id;
    const { status = 'TAKEN', voiceConfirmed = false, notes = '' } = req.body;

    const logRes = await query(
      `INSERT INTO reminder_logs (reminder_id, patient_id, scheduled_date, status, acknowledged_at, voice_confirmed, notes)
       VALUES ($1, $2, CURRENT_DATE, $3, NOW(), $4, $5)
       ON CONFLICT (reminder_id, scheduled_date)
       DO UPDATE SET status = $3, acknowledged_at = NOW(), voice_confirmed = $4, notes = $5
       RETURNING *`,
      [reminderId, patientId, status, voiceConfirmed, notes]
    );

    return res.json({
      success: true,
      message: `Reminder marked as ${status.toLowerCase()} successfully.`,
      log: logRes.rows[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createReminder = async (req: Request, res: Response) => {
  try {
    const {
      patientId = req.user?.id,
      title,
      type = 'MEDICATION',
      scheduledTime,
      daysOfWeek = [1, 2, 3, 4, 5, 6, 7],
      dosageOrNotes = '',
      voicePromptText = ''
    } = req.body;

    if (!title || !scheduledTime) {
      return res.status(400).json({ success: false, message: 'Title and scheduled time are required.' });
    }

    const result = await query(
      `INSERT INTO reminders (patient_id, title, type, scheduled_time, days_of_week, dosage_or_notes, voice_prompt_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [patientId, title, type, scheduledTime, daysOfWeek, dosageOrNotes, voicePromptText || `Reminder: ${title}`]
    );

    return res.status(201).json({
      success: true,
      message: 'Reminder created successfully.',
      reminder: result.rows[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateReminder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, type, scheduledTime, dosageOrNotes, voicePromptText, isActive } = req.body;

    const result = await query(
      `UPDATE reminders
       SET title = COALESCE($1, title),
           type = COALESCE($2, type),
           scheduled_time = COALESCE($3, scheduled_time),
           dosage_or_notes = COALESCE($4, dosage_or_notes),
           voice_prompt_text = COALESCE($5, voice_prompt_text),
           is_active = COALESCE($6, is_active)
       WHERE id = $7
       RETURNING *`,
      [title, type, scheduledTime, dosageOrNotes, voicePromptText, isActive, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reminder not found.' });
    }

    return res.json({ success: true, reminder: result.rows[0] });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteReminder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM reminders WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Reminder deleted.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
