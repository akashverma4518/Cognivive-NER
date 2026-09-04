import numpy as np
from typing import List
from ..models.profile import HistoricalSessionItem, ChangeDetectionResponse

class PerformanceChangeDetector:
    """
    Non-diagnostic activity trend analyzer.
    Detects meaningful changes in an individual's cognitive gameplay metrics
    relative to their personal baseline, without making medical claims.
    """

    @staticmethod
    def evaluate_change(
        patient_id: str,
        baseline_index: float,
        recent_sessions: List[HistoricalSessionItem]
    ) -> ChangeDetectionResponse:
        if not recent_sessions or len(recent_sessions) < 2:
            return ChangeDetectionResponse(
                patient_id=patient_id,
                performance_change_flag=False,
                status="BASELINE",
                rolling_average_score=baseline_index,
                baseline_activity_index=baseline_index,
                score_variance=0.0,
                notes="Establishing baseline activity profile with initial sessions."
            )

        # Calculate session performance scores
        scores = []
        for s in recent_sessions:
            # Score formula based on accuracy, RT, and mistakes
            acc = s.accuracy_percentage
            mistakes_deduction = s.mistakes_count * 10.0
            rt_factor = max(0.0, min(100.0, 100.0 - (s.average_reaction_time_ms / 30.0)))
            session_score = 0.50 * acc + 0.30 * rt_factor + 0.20 * max(0.0, 100.0 - mistakes_deduction)
            scores.append(session_score)

        rolling_avg = float(np.mean(scores))
        variance = float(np.var(scores))
        std_dev = float(np.std(scores))

        delta = rolling_avg - baseline_index

        # Significant negative deviation: drop of 15+ points from baseline
        if delta <= -15.0 or (delta <= -10.0 and rolling_avg < 45.0):
            return ChangeDetectionResponse(
                patient_id=patient_id,
                performance_change_flag=True,
                status="PERFORMANCE_CHANGE_DETECTED",
                rolling_average_score=round(rolling_avg, 2),
                baseline_activity_index=round(baseline_index, 2),
                score_variance=round(variance, 2),
                notes=(
                    f"Noticeable performance change detected: Recent session average ({rolling_avg:.1f}) "
                    f"is {abs(delta):.1f} points lower than activity baseline ({baseline_index:.1f}). "
                    f"Caregivers are advised to check if the senior is experiencing fatigue, dehydration, or disrupted sleep."
                )
            )

        # Meaningful improvement: gain of 8+ points above baseline
        elif delta >= 8.0:
            return ChangeDetectionResponse(
                patient_id=patient_id,
                performance_change_flag=False,
                status="IMPROVING",
                rolling_average_score=round(rolling_avg, 2),
                baseline_activity_index=round(baseline_index, 2),
                score_variance=round(variance, 2),
                notes=(
                    f"Positive progress observed: Recent session average ({rolling_avg:.1f}) "
                    f"exceeds baseline by {delta:.1f} points with strong consistency."
                )
            )

        # Stable zone
        else:
            return ChangeDetectionResponse(
                patient_id=patient_id,
                performance_change_flag=False,
                status="STABLE",
                rolling_average_score=round(rolling_avg, 2),
                baseline_activity_index=round(baseline_index, 2),
                score_variance=round(variance, 2),
                notes="Activity metrics remain steady and consistent with personal baseline."
            )
