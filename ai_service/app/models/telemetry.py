from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class TrialTelemetry(BaseModel):
    trial_index: Optional[int] = 0
    correct: bool
    reaction_time_ms: int
    target_id: Optional[str] = None
    selected_id: Optional[str] = None

class SessionTelemetry(BaseModel):
    patient_id: str
    game_id: str
    difficulty_level: int
    duration_seconds: int
    score: int
    accuracy_percentage: float
    average_reaction_time_ms: int
    mistakes_count: int = 0
    consecutive_correct: int = 0
    trials: Optional[List[TrialTelemetry]] = []
    telemetry_payload: Optional[Dict[str, Any]] = {}

class DDAResult(BaseModel):
    current_difficulty: int
    next_difficulty: int
    adjustment: str  # "INCREASED", "STABLE", "EASED"
    rationale: str
    calculated_performance: float

class EvaluateSessionRequest(BaseModel):
    session: SessionTelemetry
    current_domain_scores: Optional[Dict[str, Any]] = None

class SessionEvaluationResponse(BaseModel):
    patient_id: str
    game_id: str
    performance_score: float
    consistency_index: float
    engagement_level: str
    dda: DDAResult
    domain_scores_updated: Dict[str, float]
