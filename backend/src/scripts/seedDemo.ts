import { pool } from '../config/db';
import bcrypt from 'bcryptjs';

async function seedDemo() {
  console.log('[Seed Demo] Initializing reproducible Cognivive NER demo dataset...');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Standard demo hash for 'password123'
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Demo Users
    console.log('  -> Seeding demo users...');
    await client.query(`
      INSERT INTO users (id, full_name, email, password_hash, role, phone_number, preferred_language)
      VALUES 
      ('11111111-1111-1111-1111-111111111111', 'Ramchandra Sharma', 'elder@cognivive.com', $1, 'ELDER', '+91 9876543210', 'en'),
      ('22222222-2222-2222-2222-222222222222', 'Ananya Sharma', 'caregiver@cognivive.com', $1, 'CAREGIVER', '+91 9876543211', 'en'),
      ('33333333-3333-3333-3333-333333333333', 'Dr. Arvind Verma', 'clinician@cognivive.com', $1, 'CLINICIAN', '+91 9876543212', 'en')
      ON CONFLICT (id) DO UPDATE 
      SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash;
    `, [passwordHash]);

    // 2. Patient Profile
    console.log('  -> Seeding patient profile...');
    await client.query(`
      INSERT INTO patient_profiles (id, user_id, birth_date, emergency_contact_phone, emergency_contact_name, status, baseline_activity_index, audio_prompts_enabled, high_contrast_mode, font_scale_multiplier)
      VALUES
      ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '1952-08-15', '+91 9876543211', 'Ananya Sharma (Daughter)', 'STABLE', 62.50, TRUE, FALSE, 1.25)
      ON CONFLICT (user_id) DO UPDATE 
      SET status = 'STABLE', baseline_activity_index = 62.50;
    `);

    // 3. Caregiver - Patient Link
    console.log('  -> Seeding caregiver-patient link...');
    await client.query(`
      INSERT INTO caregiver_patient_links (id, caregiver_id, patient_id, relationship, can_edit_reminders)
      VALUES
      ('bbbb1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Daughter', TRUE)
      ON CONFLICT (caregiver_id, patient_id) DO UPDATE
      SET relationship = 'Daughter', can_edit_reminders = TRUE;
    `);

    // 4. Cognitive Activity Profile (Non-Diagnostic 5 Domains)
    console.log('  -> Seeding 5-domain cognitive profile...');
    await client.query(`
      INSERT INTO cognitive_profiles (id, patient_id, overall_performance_score, working_memory_score, processing_speed_score, attention_score, executive_flexibility_score, reminiscence_score, consistency_index, engagement_minutes_total, performance_change_flag, performance_change_notes, last_evaluated_at)
      VALUES
      ('cccc1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 68.40, 84.00, 48.50, 64.00, 70.00, 78.50, 85.00, 160, TRUE, 'Noticeable performance change detected: Recent session average (47.2) is 15.3 points lower than activity baseline (62.5). Caregivers are advised to check if the senior is experiencing fatigue, dehydration, or disrupted sleep.', NOW())
      ON CONFLICT (id) DO UPDATE
      SET overall_performance_score = 68.40, working_memory_score = 84.00, processing_speed_score = 48.50,
          attention_score = 64.00, executive_flexibility_score = 70.00, reminiscence_score = 78.50,
          consistency_index = 85.00, performance_change_flag = TRUE,
          performance_change_notes = 'Noticeable performance change detected: Recent session average (47.2) is 15.3 points lower than activity baseline (62.5). Caregivers are advised to check if the senior is experiencing fatigue, dehydration, or disrupted sleep.',
          last_evaluated_at = NOW();
    `);

    // 5. Cognitive Games
    console.log('  -> Seeding games catalog...');
    await client.query(`
      INSERT INTO games (id, title, primary_domain, min_difficulty, max_difficulty, description, instructions_key)
      VALUES
      ('memory_blossom', 'Memory Blossom', 'WORKING_MEMORY', 1, 8, 'A calming garden sequence game. Watch the flowers bloom and repeat the pattern to stimulate working memory.', 'instructions.memory_blossom'),
      ('quick_harvest', 'Quick Harvest', 'PROCESSING_SPEED', 1, 8, 'Tap seasonal fruits quickly as they appear to reinforce visual attention and processing speed.', 'instructions.quick_harvest'),
      ('golden_memories', 'Golden Memories', 'REMINISCENCE', 1, 8, 'Reflect on nostalgic cultural sights, classic melodies, and historic trivia to foster semantic recall.', 'instructions.golden_memories')
      ON CONFLICT (id) DO UPDATE
      SET title = EXCLUDED.title, description = EXCLUDED.description;
    `);

    // 6. Game Difficulty States
    console.log('  -> Seeding player difficulty states...');
    await client.query(`
      INSERT INTO player_game_difficulty_states (patient_id, game_id, current_difficulty, consecutive_successes, consecutive_struggles, ai_adjustment_notes, updated_at)
      VALUES
      ('11111111-1111-1111-1111-111111111111', 'memory_blossom', 3, 2, 0, 'Consistently accurate flower sequence recall. Advanced to Level 3.', NOW()),
      ('11111111-1111-1111-1111-111111111111', 'quick_harvest', 1, 0, 0, 'Operating at Level 1 base speed with visual focus cues.', NOW()),
      ('11111111-1111-1111-1111-111111111111', 'golden_memories', 3, 3, 0, 'Strong cultural reminiscence engagement. Operating at Level 3.', NOW())
      ON CONFLICT (patient_id, game_id) DO UPDATE
      SET current_difficulty = EXCLUDED.current_difficulty, ai_adjustment_notes = EXCLUDED.ai_adjustment_notes, updated_at = NOW();
    `);

    // 7. Reminders
    console.log('  -> Seeding daily smart reminders...');
    await client.query(`
      INSERT INTO reminders (id, patient_id, title, type, scheduled_time, days_of_week, dosage_or_notes, voice_prompt_text, is_active)
      VALUES
      ('dddd1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Morning Blood Pressure Medication', 'MEDICATION', '08:30:00', '{1,2,3,4,5,6,7}', '1 tablet of Amlodipine 5mg with water after breakfast', 'Good morning Ramchandra ji. Please take your morning blood pressure medication.', TRUE),
      ('dddd2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Mid-Day Hydration & Walk', 'HYDRATION', '11:30:00', '{1,2,3,4,5,6,7}', 'Drink a fresh glass of warm water and take a 5-minute stroll', 'Time to drink a glass of water and stretch your legs.', TRUE),
      ('dddd3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Afternoon Memory Blossom Session', 'COGNITIVE_SESSION', '16:00:00', '{1,2,3,4,5,6,7}', 'Play 2 rounds of Memory Blossom for gentle brain stimulation', 'It is time for your relaxing Memory Blossom game.', TRUE),
      ('dddd4444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Evening Calcium Tablet', 'MEDICATION', '20:30:00', '{1,2,3,4,5,6,7}', '1 calcium tablet with warm milk', 'Good evening Ramchandra ji. Please take your calcium tablet after dinner.', TRUE)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 8. Today's Reminder Logs
    console.log("  -> Seeding today's reminder execution logs...");
    await client.query(`
      INSERT INTO reminder_logs (reminder_id, patient_id, scheduled_date, status, acknowledged_at, voice_confirmed, notes)
      VALUES
      ('dddd1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', CURRENT_DATE, 'TAKEN', NOW() - INTERVAL '2 hours', TRUE, 'Confirmed via voice response'),
      ('dddd2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', CURRENT_DATE, 'SNOOZED', NOW() - INTERVAL '30 minutes', FALSE, 'Snoozed 15 min'),
      ('dddd3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', CURRENT_DATE, 'TAKEN', NOW() - INTERVAL '1 hour', FALSE, 'Completed after game session'),
      ('dddd4444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', CURRENT_DATE, 'TAKEN', NOW() - INTERVAL '10 minutes', TRUE, 'Voice confirmed')
      ON CONFLICT (reminder_id, scheduled_date) DO UPDATE
      SET status = EXCLUDED.status, acknowledged_at = EXCLUDED.acknowledged_at, voice_confirmed = EXCLUDED.voice_confirmed;
    `);

    await client.query('COMMIT');
    console.log('✅ Demo dataset seeded successfully!');
    console.log('\nDemo Accounts:');
    console.log('  * Elder:     elder@cognivive.com     / password123');
    console.log('  * Caregiver: caregiver@cognivive.com / password123');
    console.log('  * Clinician: clinician@cognivive.com / password123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to seed demo dataset:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDemo();
