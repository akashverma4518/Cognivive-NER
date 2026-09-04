export type UserRole = 'ELDER' | 'CAREGIVER' | 'CLINICIAN' | 'ADMIN';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone_number?: string;
  preferred_language?: string;
}

export interface PatientProfile {
  id: string;
  user_id: string;
  birth_date?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  status: 'BASELINE' | 'IMPROVING' | 'STABLE' | 'PERFORMANCE_CHANGE_DETECTED';
  baseline_activity_index: number;
  audio_prompts_enabled: boolean;
  high_contrast_mode: boolean;
  font_scale_multiplier: number;
}

export interface Reminder {
  id: string;
  patient_id: string;
  title: string;
  type: 'MEDICATION' | 'MEAL' | 'HYDRATION' | 'APPOINTMENT' | 'COGNITIVE_SESSION' | 'ROUTINE';
  scheduled_time: string;
  dosage_or_notes?: string;
  voice_prompt_text?: string;
  is_active: boolean;
  today_status: 'PENDING' | 'TAKEN' | 'MISSED' | 'SNOOZED';
  acknowledged_at?: string;
  voice_confirmed?: boolean;
}

export interface GameItem {
  id: string;
  title: string;
  primary_domain: string;
  min_difficulty: number;
  max_difficulty: number;
  description: string;
}

export interface CognitiveProfile {
  overall_performance_score: string | number;
  working_memory_score: string | number;
  processing_speed_score: string | number;
  attention_score: string | number;
  executive_flexibility_score: string | number;
  reminiscence_score: string | number;
  consistency_index: string | number;
  engagement_minutes_total: number;
  performance_change_flag: boolean;
  performance_change_notes?: string;
}

export interface RecommendedActivity {
  game_id: string;
  title: string;
  target_domain: string;
  suggested_difficulty: number;
  rationale: string;
  estimated_minutes: number;
}

export interface DailyRecommendations {
  primary_recommendation: RecommendedActivity;
  daily_schedule_suggestions: RecommendedActivity[];
  wellness_note: string;
}
