-- ============================================================================
-- COGNIVIVE NER - PHASE 8 SCHEMA EXTENSIONS (ADDITIVE & NON-DIAGNOSTIC)
-- ============================================================================

-- 1. Additive columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS ner_region VARCHAR(60) DEFAULT 'Assam';
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(30);

-- 2. Additive columns to patient_profiles table
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS ner_region VARCHAR(60) DEFAULT 'Assam';
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS age INT;
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(30);

-- 3. Additive columns to reminders table for enhanced medicine tracking
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS medicine_name VARCHAR(120);
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS dosage_text VARCHAR(100);
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS frequency_text VARCHAR(60);
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS end_date DATE;

-- 4. Family Memory Vault (Personalized memory-assistance items)
CREATE TABLE IF NOT EXISTS family_memory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_name VARCHAR(120) NOT NULL,
    relationship VARCHAR(80) NOT NULL,
    photo_url TEXT,
    important_place VARCHAR(150),
    important_event VARCHAR(150),
    memory_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Wellness Activities Tracking (Movement, Walking, Stretching - Non-Prescriptive)
CREATE TABLE IF NOT EXISTS wellness_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(60) NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 15,
    completed BOOLEAN DEFAULT TRUE,
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Caregiver Observational Notes
CREATE TABLE IF NOT EXISTS caregiver_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_family_memories_patient ON family_memory_items(patient_id);
CREATE INDEX IF NOT EXISTS idx_wellness_patient_date ON wellness_activities(patient_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_caregiver_notes_pair ON caregiver_notes(caregiver_id, patient_id);
