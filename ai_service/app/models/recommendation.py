from typing import List, Optional
from pydantic import BaseModel

class RecommendationRequest(BaseModel):
    patient_id: str
    working_memory_score: float
    processing_speed_score: float
    attention_score: float
    executive_flexibility_score: float
    reminiscence_score: float
    consistency_index: float
    recent_game_ids: Optional[List[str]] = []

class RecommendedActivity(BaseModel):
    game_id: str
    title: str
    target_domain: str
    suggested_difficulty: int
    rationale: str
    estimated_minutes: int

class RecommendationResponse(BaseModel):
    patient_id: str
    primary_recommendation: RecommendedActivity
    daily_schedule_suggestions: List[RecommendedActivity]
    wellness_note: str

class VoiceIntentRequest(BaseModel):
    text: str
    language: Optional[str] = "en"

class VoiceIntentResponse(BaseModel):
    raw_query: str
    intent: str  # "ACKNOWLEDGE_REMINDER", "START_GAME", "GET_SCHEDULE", "SOS_HELP", "UNKNOWN"
    confidence: float
    entities: dict
