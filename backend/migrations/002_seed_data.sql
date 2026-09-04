-- ============================================================================
-- COGNIVIVE NER - SEED DATA (NON-DIAGNOSTIC)
-- ============================================================================

-- Fixed IDs for deterministic linking
-- Passwords below are bcrypt hash of 'password123' : $2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGPEWi9GQTHPF5DUG
-- Elder: 'elder@cognivive.com'
-- Caregiver: 'caregiver@cognivive.com'
-- Clinician: 'clinician@cognivive.com'

-- 1. Seed Users
INSERT INTO users (id, full_name, email, password_hash, role, phone_number, preferred_language)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Ramchandra Sharma', 'elder@cognivive.com', '$2a$10$r.yVSCSKxBO3FbjMkG2dYumf4J5f859WxbPyhemJj5AoPoKDgXULC', 'ELDER', '+91 9876543210', 'en'),
('22222222-2222-2222-2222-222222222222', 'Ananya Sharma', 'caregiver@cognivive.com', '$2a$10$r.yVSCSKxBO3FbjMkG2dYumf4J5f859WxbPyhemJj5AoPoKDgXULC', 'CAREGIVER', '+91 9876543211', 'en'),
('33333333-3333-3333-3333-333333333333', 'Dr. Arvind Verma', 'clinician@cognivive.com', '$2a$10$r.yVSCSKxBO3FbjMkG2dYumf4J5f859WxbPyhemJj5AoPoKDgXULC', 'CLINICIAN', '+91 9876543212', 'en')
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Patient Profile
INSERT INTO patient_profiles (id, user_id, birth_date, emergency_contact_phone, emergency_contact_name, status, baseline_activity_index, audio_prompts_enabled, high_contrast_mode, font_scale_multiplier)
VALUES
('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '1952-08-15', '+91 9876543211', 'Ananya Sharma (Daughter)', 'STABLE', 62.50, TRUE, FALSE, 1.25)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Seed Caregiver - Patient Link
INSERT INTO caregiver_patient_links (id, caregiver_id, patient_id, relationship, can_edit_reminders)
VALUES
('bbbb1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Daughter', TRUE)
ON CONFLICT (caregiver_id, patient_id) DO NOTHING;

-- 4. Seed Initial Cognitive Activity Profile
INSERT INTO cognitive_profiles (id, patient_id, overall_performance_score, working_memory_score, processing_speed_score, attention_score, executive_flexibility_score, reminiscence_score, consistency_index, engagement_minutes_total, performance_change_flag, performance_change_notes)
VALUES
('cccc1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 64.20, 68.00, 58.50, 62.00, 65.00, 72.50, 81.00, 145, FALSE, 'Activity performance is currently stable with strong engagement in reminiscence exercises.')
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Prioritized Games Catalog
INSERT INTO games (id, title, primary_domain, min_difficulty, max_difficulty, description, instructions_key)
VALUES
('memory_blossom', 'Memory Blossom', 'WORKING_MEMORY', 1, 8, 'A calming garden sequence game. Watch the flowers bloom and repeat the pattern to stimulate working memory.', 'instructions.memory_blossom'),
('quick_harvest', 'Quick Harvest', 'PROCESSING_SPEED', 1, 8, 'Tap seasonal fruits quickly as they appear to reinforce visual attention and processing speed.', 'instructions.quick_harvest'),
('golden_memories', 'Golden Memories', 'REMINISCENCE', 1, 8, 'Reflect on nostalgic cultural sights, classic melodies, and historic trivia to foster semantic recall.', 'instructions.golden_memories')
ON CONFLICT (id) DO NOTHING;

-- 6. Seed Player Game Difficulty States
INSERT INTO player_game_difficulty_states (patient_id, game_id, current_difficulty, consecutive_successes, consecutive_struggles, ai_adjustment_notes)
VALUES
('11111111-1111-1111-1111-111111111111', 'memory_blossom', 2, 1, 0, 'Operating at Level 2 with good sequence accuracy.'),
('11111111-1111-1111-1111-111111111111', 'quick_harvest', 1, 0, 0, 'Operating at Level 1 base speed.'),
('11111111-1111-1111-1111-111111111111', 'golden_memories', 2, 2, 0, 'Operating at Level 2 with high recognition.')
ON CONFLICT (patient_id, game_id) DO NOTHING;

-- 7. Seed Real Sample Game Telemetry Sessions
INSERT INTO game_sessions (patient_id, game_id, difficulty_level, duration_seconds, score, accuracy_percentage, average_reaction_time_ms, mistakes_count, consecutive_correct, engagement_level, telemetry_payload, client_created_at)
VALUES
('11111111-1111-1111-1111-111111111111', 'memory_blossom', 2, 120, 240, 85.00, 1120, 1, 4, 'ACTIVE', '{"trials": [{"sequence": 3, "correct": true, "rt": 1100}, {"sequence": 4, "correct": true, "rt": 1140}]}'::jsonb, NOW() - INTERVAL '2 days'),
('11111111-1111-1111-1111-111111111111', 'quick_harvest', 1, 95, 180, 80.00, 890, 2, 5, 'ACTIVE', '{"trials": [{"target": "apple", "hit": true, "rt": 870}, {"target": "mango", "hit": true, "rt": 910}]}'::jsonb, NOW() - INTERVAL '1 day'),
('11111111-1111-1111-1111-111111111111', 'golden_memories', 2, 140, 310, 92.00, 1450, 0, 6, 'ACTIVE', '{"trials": [{"topic": "music", "correct": true, "rt": 1420}]}'::jsonb, NOW() - INTERVAL '3 hours');

-- 8. Seed Reminders
INSERT INTO reminders (id, patient_id, title, type, scheduled_time, days_of_week, dosage_or_notes, voice_prompt_text, is_active)
VALUES
('dddd1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Morning Blood Pressure Medication', 'MEDICATION', '08:30:00', '{1,2,3,4,5,6,7}', '1 tablet of Amlodipine 5mg with water after breakfast', 'Good morning Ramchandra ji. Please take your morning blood pressure medication.', TRUE),
('dddd2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Mid-Day Hydration & Walk', 'HYDRATION', '11:30:00', '{1,2,3,4,5,6,7}', 'Drink a fresh glass of warm water and take a 5-minute stroll', 'Time to drink a glass of water and stretch your legs.', TRUE),
('dddd3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Afternoon Memory Blossom Session', 'COGNITIVE_SESSION', '16:00:00', '{1,2,3,4,5,6,7}', 'Play 2 rounds of Memory Blossom for gentle brain stimulation', 'It is time for your relaxing Memory Blossom game.', TRUE),
('dddd4444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Evening Calcium Tablet', 'MEDICATION', '20:30:00', '{1,2,3,4,5,6,7}', '1 calcium tablet with warm milk', 'Good evening Ramchandra ji. Please take your calcium tablet after dinner.', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 9. Seed Today's Reminder Logs
INSERT INTO reminder_logs (reminder_id, patient_id, scheduled_date, status, acknowledged_at, voice_confirmed, notes)
VALUES
('dddd1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', CURRENT_DATE, 'TAKEN', NOW() - INTERVAL '2 hours', TRUE, 'Confirmed via voice response'),
('dddd2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', CURRENT_DATE, 'PENDING', NULL, FALSE, NULL)
ON CONFLICT (reminder_id, scheduled_date) DO NOTHING;

-- 10. Seed AI Recommendation
INSERT INTO ai_recommendations (patient_id, recommended_game_id, target_domain, suggested_difficulty, rationale, completed, created_at)
VALUES
('11111111-1111-1111-1111-111111111111', 'quick_harvest', 'PROCESSING_SPEED', 2, 'Processing speed activity is recommended today to gently challenge visual attention while maintaining high motivation.', FALSE, CURRENT_DATE);
