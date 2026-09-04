from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

from .config import settings
from .models.telemetry import SessionTelemetry, SessionEvaluationResponse, DDAResult, EvaluateSessionRequest
from .models.profile import (
    ChangeDetectionRequest,
    ChangeDetectionResponse,
    CognitiveActivityProfileModel
)
from .models.recommendation import (
    RecommendationRequest,
    RecommendationResponse,
    VoiceIntentRequest,
    VoiceIntentResponse
)
from .services.performance_analyzer import PerformanceAnalyzer
from .services.dda_engine import DDAEngine
from .services.cognitive_profiler import CognitiveProfiler
from .services.change_detector import PerformanceChangeDetector
from .services.recommendation_engine import RecommendationEngine
from .services.voice_intent_parser import VoiceIntentParser

app = FastAPI(
    title="Cognivive NER - Cognitive Assistance & Activity Analytics Engine",
    version="1.0.0",
    description="Transparent, non-diagnostic cognitive activity telemetry processing and personalized DDA"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "Cognivive NER Python AI Service",
        "version": "1.0.0",
        "diagnostic_mode": "NON_DIAGNOSTIC_ASSISTIVE_ONLY"
    }

@app.post("/ai/v1/evaluate-session", response_model=SessionEvaluationResponse)
def evaluate_session(req: EvaluateSessionRequest):
    try:
        session = req.session
        raw_scores = req.current_domain_scores or {}

        # Safely extract and convert numeric scores
        current_domain_scores = {
            "working_memory_score": float(raw_scores.get("working_memory_score", 50.0) or 50.0),
            "processing_speed_score": float(raw_scores.get("processing_speed_score", 50.0) or 50.0),
            "attention_score": float(raw_scores.get("attention_score", 50.0) or 50.0),
            "executive_flexibility_score": float(raw_scores.get("executive_flexibility_score", 50.0) or 50.0),
            "reminiscence_score": float(raw_scores.get("reminiscence_score", 50.0) or 50.0),
            "overall_performance_score": float(raw_scores.get("overall_performance_score", 50.0) or 50.0),
        }

        # 1. Real mathematical consistency index
        consistency_idx = PerformanceAnalyzer.calculate_consistency(
            session.trials, session.average_reaction_time_ms
        )

        # 2. Real composite performance score
        performance_score = PerformanceAnalyzer.calculate_session_performance(
            session, consistency_idx
        )

        # 3. Engagement classification
        engagement = PerformanceAnalyzer.determine_engagement(
            session.duration_seconds, session.mistakes_count, len(session.trials)
        )

        # 4. Transparent DDA calculation
        dda_result = DDAEngine.compute_next_difficulty(
            session=session,
            performance_score=performance_score,
            consecutive_successes=1 if performance_score >= 78.0 else 0,
            consecutive_struggles=1 if performance_score < 48.0 else 0
        )

        # 5. Non-diagnostic 5-domain profile update
        updated_domains = CognitiveProfiler.update_profile(
            current_profile=current_domain_scores,
            session=session,
            session_performance=performance_score
        )

        return SessionEvaluationResponse(
            patient_id=session.patient_id,
            game_id=session.game_id,
            performance_score=performance_score,
            consistency_index=consistency_idx,
            engagement_level=engagement,
            dda=dda_result,
            domain_scores_updated=updated_domains
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation error: {str(e)}")

@app.post("/ai/v1/compute-dda", response_model=DDAResult)
def compute_dda(session: SessionTelemetry, performance_score: float = 70.0):
    try:
        return DDAEngine.compute_next_difficulty(
            session=session,
            performance_score=performance_score,
            consecutive_successes=0,
            consecutive_struggles=0
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DDA error: {str(e)}")

@app.post("/ai/v1/detect-change", response_model=ChangeDetectionResponse)
def detect_performance_change(request: ChangeDetectionRequest):
    try:
        return PerformanceChangeDetector.evaluate_change(
            patient_id=request.patient_id,
            baseline_index=request.baseline_activity_index,
            recent_sessions=request.recent_sessions
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Change detection error: {str(e)}")

@app.post("/ai/v1/recommendations", response_model=RecommendationResponse)
def generate_recommendations(request: RecommendationRequest):
    try:
        return RecommendationEngine.generate_recommendations(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")

@app.post("/ai/v1/parse-voice", response_model=VoiceIntentResponse)
def parse_voice_query(request: VoiceIntentRequest):
    try:
        return VoiceIntentParser.parse_intent(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice parsing error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
