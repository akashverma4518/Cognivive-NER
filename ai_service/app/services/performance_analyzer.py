import numpy as np
from typing import List
from ..models.telemetry import TrialTelemetry, SessionTelemetry

class PerformanceAnalyzer:
    """
    Computes real mathematical metrics for elderly cognitive sessions:
    - Consistency Index (derived from reaction time standard deviation)
    - Session Performance Score (0 to 100)
    - Engagement classification
    Strictly non-diagnostic.
    """

    # Baseline target reaction times (ms) calibrated for elderly age cohorts (60+)
    BASE_TARGET_RT = {
        "memory_blossom": 1400,   # sequence recall requires deliberate thought
        "quick_harvest": 1100,    # speed & visual search
        "golden_memories": 1800,  # reminiscing trivia
        "pattern_path": 1500,     # attention & sequential visual recall
        "match_pairs": 1400,      # card matching & working memory
        "sort_remember": 1600,    # executive categorizing and recall
        "sequence_stories": 1800  # narrative sequencing & reminiscing
    }

    @staticmethod
    def calculate_consistency(trials: List[TrialTelemetry], avg_rt: int) -> float:
        """
        Consistency is evaluated via coefficient of variation of reaction time.
        Low variation across trials indicates high focus/consistency.
        Returns score from 0.0 to 100.0.
        """
        if not trials or len(trials) < 2:
            return 75.0  # default prior

        rts = [t.reaction_time_ms for t in trials if t.reaction_time_ms > 0]
        if len(rts) < 2:
            return 75.0

        std_dev = float(np.std(rts))
        mean_rt = float(np.mean(rts))

        if mean_rt <= 0:
            return 70.0

        # Coefficient of variation (CV)
        cv = std_dev / mean_rt

        # Normal elder CV typically ranges from 0.15 (very consistent) to 0.60+ (variable)
        # Map CV: 0.10 -> 95%, 0.30 -> 75%, 0.60 -> 45%
        consistency = max(10.0, min(100.0, 100.0 - (cv * 100.0)))
        return round(consistency, 2)

    @staticmethod
    def calculate_session_performance(session: SessionTelemetry, consistency_idx: float) -> float:
        """
        Multi-factor non-diagnostic performance evaluation:
        Weights:
        - Accuracy (45%)
        - Reaction Time Adequacy (25%)
        - Error Suppression / Few Mistakes (20%)
        - Consistency Index (10%)
        Returns a 0 to 100 normalized score.
        """
        acc_component = max(0.0, min(100.0, session.accuracy_percentage))

        # RT component using smooth sigmoid mapping relative to target RT
        target_rt = PerformanceAnalyzer.BASE_TARGET_RT.get(session.game_id, 1300)
        # If avg RT <= target_rt, component is high (>80)
        diff_rt = target_rt - session.average_reaction_time_ms
        # Sigmoid: 1 / (1 + exp(-diff_rt / 400))
        rt_sigmoid = 1.0 / (1.0 + np.exp(-diff_rt / 400.0))
        rt_component = float(rt_sigmoid * 100.0)

        # Mistakes penalty: 0 mistakes = 100%, each mistake deducts proportionally
        mistakes_penalty = max(0.0, 100.0 - (session.mistakes_count * 15.0))

        # Overall composite
        composite = (
            0.45 * acc_component +
            0.25 * rt_component +
            0.20 * mistakes_penalty +
            0.10 * consistency_idx
        )

        return round(float(np.clip(composite, 0.0, 100.0)), 2)

    @staticmethod
    def determine_engagement(duration_seconds: int, mistakes_count: int, trials_count: int) -> str:
        """
        Classifies session engagement based on duration and trial responsiveness.
        """
        if duration_seconds >= 60 and trials_count >= 3:
            return "ACTIVE"
        elif duration_seconds < 30 and mistakes_count > 3:
            return "FATIGUED"
        else:
            return "INTERMITTENT"
