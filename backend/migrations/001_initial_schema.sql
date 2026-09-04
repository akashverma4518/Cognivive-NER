-- ============================================================================
-- COGNIVIVE NER - DATABASE SCHEMA (NON-DIAGNOSTIC)
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean drop for idempotency if recreating
DROP TABLE IF EXISTS offline_sync_logs CASCADE;
DROP TABLE IF EXISTS ai_recommendations CASCADE;
DROP TABLE IF EXISTS reminder_logs CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS player_game_difficulty_states CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS cognitive_profiles CASCADE;
DROP TABLE IF EXISTS caregiver_patient_links CASCADE;
DROP TABLE IF EXISTS patient_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS cognitive_domain CASCADE;
DROP TYPE IF EXISTS reminder_status CASCADE;
DROP TYPE IF EXISTS reminder_type CASCADE;
DROP TYPE IF EXISTS activity_trend_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Enums
CREATE TYPE user_role AS ENUM ('ELDER', 'CAREGIVER', 'CLINICIAN', 'ADMIN');
CREATE TYPE activity_trend_status AS ENUM ('BASELINE', 'IMPROVING', 'STABLE', 'PERFORMANCE_CHANGE_DETECTED');
CREATE TYPE reminder_type AS ENUM ('MEDICATION', 'MEAL', 'HYDRATION', 'APPOINTMENT', 'COGNITIVE_SESSION', 'ROUTINE');
CREATE TYPE reminder_status AS ENUM ('PENDING', 'TAKEN', 'MISSED', 'SNOOZED');
CREATE TYPE cognitive_domain AS ENUM ('WORKING_MEMORY', 'PROCESSING_SPEED', 'ATTENTION', 'EXECUTIVE_FLEXIBILITY', 'REMINISCENCE');

-- 1. Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'ELDER',
    phone_number VARCHAR(20),
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Patient Profiles (Elder activity baseline & accessibility)
CREATE TABLE patient_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    birth_date DATE,
    emergency_contact_phone VARCHAR(20) NOT NULL,
    emergency_contact_name VARCHAR(120) NOT NULL,
    status activity_trend_status DEFAULT 'BASELINE',
    baseline_activity_index NUMERIC(5, 2) DEFAULT 50.0,
    audio_prompts_enabled BOOLEAN DEFAULT TRUE,
    high_contrast_mode BOOLEAN DEFAULT FALSE,
    font_scale_multiplier NUMERIC(3, 2) DEFAULT 1.25,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Caregiver - Patient Association
CREATE TABLE caregiver_patient_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship VARCHAR(60) NOT NULL DEFAULT 'Caregiver',
    can_edit_reminders BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(caregiver_id, patient_id)
);

-- 4. Cognitive Activity Profile (5 non-diagnostic domains)
CREATE TABLE cognitive_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    overall_performance_score NUMERIC(5, 2) NOT NULL DEFAULT 50.0,
    working_memory_score NUMERIC(5, 2) NOT NULL DEFAULT 50.0,
    processing_speed_score NUMERIC(5, 2) NOT NULL DEFAULT 50.0,
    attention_score NUMERIC(5, 2) NOT NULL DEFAULT 50.0,
    executive_flexibility_score NUMERIC(5, 2) NOT NULL DEFAULT 50.0,
    reminiscence_score NUMERIC(5, 2) NOT NULL DEFAULT 50.0,
    consistency_index NUMERIC(5, 2) DEFAULT 75.0,
    engagement_minutes_total INT DEFAULT 0,
    performance_change_flag BOOLEAN DEFAULT FALSE,
    performance_change_notes TEXT,
    last_evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Game Catalog
CREATE TABLE games (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    primary_domain cognitive_domain NOT NULL,
    min_difficulty INT DEFAULT 1,
    max_difficulty INT DEFAULT 8,
    description TEXT,
    instructions_key VARCHAR(100) NOT NULL
);

-- 6. Game Session Telemetry
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id VARCHAR(50) NOT NULL REFERENCES games(id),
    difficulty_level INT NOT NULL,
    duration_seconds INT NOT NULL,
    score INT NOT NULL,
    accuracy_percentage NUMERIC(5, 2) NOT NULL,
    average_reaction_time_ms INT NOT NULL,
    mistakes_count INT NOT NULL DEFAULT 0,
    consecutive_correct INT NOT NULL DEFAULT 0,
    engagement_level VARCHAR(20) DEFAULT 'ACTIVE',
    telemetry_payload JSONB DEFAULT '{}'::jsonb,
    client_created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Adaptive Difficulty State (Per patient, per game)
CREATE TABLE player_game_difficulty_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id VARCHAR(50) NOT NULL REFERENCES games(id),
    current_difficulty INT NOT NULL DEFAULT 1,
    consecutive_successes INT DEFAULT 0,
    consecutive_struggles INT DEFAULT 0,
    ai_adjustment_notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id, game_id)
);

-- 8. Reminders & Routines
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    type reminder_type NOT NULL,
    scheduled_time TIME NOT NULL,
    days_of_week INT[] DEFAULT '{1,2,3,4,5,6,7}',
    dosage_or_notes TEXT,
    voice_prompt_text TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Reminder Execution Logs
CREATE TABLE reminder_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reminder_id UUID NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    status reminder_status DEFAULT 'PENDING',
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    voice_confirmed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    UNIQUE(reminder_id, scheduled_date)
);

-- 10. AI Personalized Daily Activity Recommendations
CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommended_game_id VARCHAR(50) REFERENCES games(id),
    target_domain cognitive_domain NOT NULL,
    suggested_difficulty INT NOT NULL,
    rationale TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at DATE DEFAULT CURRENT_DATE
);

-- 11. Offline Sync Audit Logs
CREATE TABLE offline_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_batch_id VARCHAR(100) NOT NULL,
    records_count INT NOT NULL,
    status VARCHAR(30) NOT NULL,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for high-frequency queries
CREATE INDEX idx_game_sessions_patient_created ON game_sessions(patient_id, client_created_at DESC);
CREATE INDEX idx_reminder_logs_patient_date ON reminder_logs(patient_id, scheduled_date);
CREATE INDEX idx_reminders_patient_active ON reminders(patient_id, is_active);
CREATE INDEX idx_caregiver_patient ON caregiver_patient_links(caregiver_id, patient_id);
