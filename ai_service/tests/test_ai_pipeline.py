import sys
import os

# Add parent directory to sys.path so we can import app modules directly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.telemetry import SessionTelemetry, TrialTelemetry
from app.models.profile import HistoricalSessionItem, ChangeDetectionRequest
from app.models.recommendation import RecommendationRequest, VoiceIntentRequest
from app.services.performance_analyzer import PerformanceAnalyzer
from app.services.dda_engine import DDAEngine
from app.services.cognitive_profiler import CognitiveProfiler
from app.services.change_detector import PerformanceChangeDetector
from app.services.recommendation_engine import RecommendationEngine
from app.services.voice_intent_parser import VoiceIntentParser

def test_performance_and_dda():
    trials = [
        TrialTelemetry(trial_index=1, correct=True, reaction_time_ms=1100),
        TrialTelemetry(trial_index=2, correct=True, reaction_time_ms=1150),
        TrialTelemetry(trial_index=3, correct=True, reaction_time_ms=1080),
        TrialTelemetry(trial_index=4, correct=True, reaction_time_ms=1120),
    ]
    session = SessionTelemetry(
        patient_id="11111111-1111-1111-1111-111111111111",
        game_id="memory_blossom",
        difficulty_level=2,
        duration_seconds=120,
        score=250,
        accuracy_percentage=100.0,
        average_reaction_time_ms=1112,
        mistakes_count=0,
        consecutive_correct=4,
        trials=trials
    )

    consistency = PerformanceAnalyzer.calculate_consistency(trials, 1112)
    assert consistency > 80.0, f"Expected high consistency, got {consistency}"

    score = PerformanceAnalyzer.calculate_session_performance(session, consistency)
    assert score >= 80.0, f"Expected high performance score, got {score}"

    dda = DDAEngine.compute_next_difficulty(session, score, consecutive_successes=1, consecutive_struggles=0)
    assert dda.next_difficulty == 3, f"Expected difficulty advance to 3, got {dda.next_difficulty}"
    print(f"PASSED: Performance & DDA test (Score: {score}, Next Difficulty: {dda.next_difficulty})")

def test_cognitive_profile_update():
    current_domains = {
        "working_memory_score": 50.0,
        "processing_speed_score": 50.0,
        "attention_score": 50.0,
        "executive_flexibility_score": 50.0,
        "reminiscence_score": 50.0,
        "overall_performance_score": 50.0
    }
    session = SessionTelemetry(
        patient_id="11111111-1111-1111-1111-111111111111",
        game_id="memory_blossom",
        difficulty_level=2,
        duration_seconds=120,
        score=250,
        accuracy_percentage=90.0,
        average_reaction_time_ms=1150,
        mistakes_count=1,
        consecutive_correct=3
    )
    updated = CognitiveProfiler.update_profile(current_domains, session, 85.0)
    assert updated["working_memory_score"] > 50.0, "Working memory score should increase"
    assert updated["overall_performance_score"] > 50.0, "Overall score should increase"
    print(f"PASSED: Cognitive Profiler test (Working Memory: {updated['working_memory_score']}, Overall: {updated['overall_performance_score']})")

def test_performance_change_detector():
    # Simulate a sudden performance drop
    struggling_sessions = [
        HistoricalSessionItem(game_id="memory_blossom", accuracy_percentage=40.0, average_reaction_time_ms=2500, mistakes_count=5, score=80, duration_seconds=60),
        HistoricalSessionItem(game_id="quick_harvest", accuracy_percentage=35.0, average_reaction_time_ms=2600, mistakes_count=6, score=70, duration_seconds=60),
        HistoricalSessionItem(game_id="golden_memories", accuracy_percentage=45.0, average_reaction_time_ms=2400, mistakes_count=4, score=90, duration_seconds=60),
    ]
    res = PerformanceChangeDetector.evaluate_change("11111111-1111-1111-1111-111111111111", 65.0, struggling_sessions)
    assert res.performance_change_flag is True, "Should flag performance change on sudden drop"
    assert res.status == "PERFORMANCE_CHANGE_DETECTED"
    print(f"PASSED: Performance Change Detector test (Status: {res.status}, Flag: {res.performance_change_flag})")

def test_recommendation_and_voice():
    rec_req = RecommendationRequest(
        patient_id="11111111-1111-1111-1111-111111111111",
        working_memory_score=75.0,
        processing_speed_score=45.0,  # Lowest domain
        attention_score=50.0,
        executive_flexibility_score=60.0,
        reminiscence_score=70.0,
        consistency_index=70.0
    )
    recs = RecommendationEngine.generate_recommendations(rec_req)
    assert recs.primary_recommendation.game_id == "quick_harvest", "Should recommend quick_harvest for lowest speed score"

    # Test voice intent
    voice_res1 = VoiceIntentParser.parse_intent(VoiceIntentRequest(text="I took my morning medicine"))
    assert voice_res1.intent == "ACKNOWLEDGE_REMINDER"

    voice_res2 = VoiceIntentParser.parse_intent(VoiceIntentRequest(text="Maine dawai le li"))
    assert voice_res2.intent == "ACKNOWLEDGE_REMINDER"

    voice_res3 = VoiceIntentParser.parse_intent(VoiceIntentRequest(text="Please start memory blossom game"))
    assert voice_res3.intent == "START_GAME"
    assert voice_res3.entities.get("game_id") == "memory_blossom"

    print("PASSED: Recommendation Engine & Voice Intent Parser test")

if __name__ == "__main__":
    test_performance_and_dda()
    test_cognitive_profile_update()
    test_performance_change_detector()
    test_recommendation_and_voice()
    print("\nALL AI TESTS PASSED SUCCESSFULLY!")
