from typing import Optional, List
from pydantic import BaseModel

class CognitiveActivityProfileModel(BaseModel):
    patient_id: str
    overall_performance_score: float
    working_memory_score: float
    processing_speed_score: float
    attention_score: float
    executive_flexibility_score: float
    reminiscence_score: float
    consistency_index: float
    engagement_minutes_total: int
    performance_change_flag: bool = False
    performance_change_notes: Optional[str] = None

class HistoricalSessionItem(BaseModel):
    game_id: str
    accuracy_percentage: float
    average_reaction_time_ms: int
    mistakes_count: int
    score: int
    duration_seconds: int

class ChangeDetectionRequest(BaseModel):
    patient_id: str
    baseline_activity_index: float = 50.0
    recent_sessions: List[HistoricalSessionItem]

class ChangeDetectionResponse(BaseModel):
    patient_id: str
    performance_change_flag: bool
    status: str  # "BASELINE", "STABLE", "IMPROVING", "PERFORMANCE_CHANGE_DETECTED"
    rolling_average_score: float
    baseline_activity_index: float
    score_variance: float
    notes: str
