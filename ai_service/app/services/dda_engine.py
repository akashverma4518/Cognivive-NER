from ..models.telemetry import DDAResult, SessionTelemetry

class DDAEngine:
    """
    Transparent & Explainable Dynamic Difficulty Adjustment (DDA)
    Ensures elderly users are challenged in their flow zone without cognitive frustration.
    """

    MIN_DIFFICULTY = 1
    MAX_DIFFICULTY = 8

    @staticmethod
    def compute_next_difficulty(
        session: SessionTelemetry,
        performance_score: float,
        consecutive_successes: int = 0,
        consecutive_struggles: int = 0
    ) -> DDAResult:
        curr = session.difficulty_level
        acc = session.accuracy_percentage
        mistakes = session.mistakes_count
        rt = session.average_reaction_time_ms

        next_diff = curr
        adjustment = "STABLE"
        rationale = ""

        # Condition for Increasing Difficulty:
        # High performance (>= 78%), high accuracy (>= 80%), low mistakes (<= 1)
        if performance_score >= 78.0 and acc >= 80.0 and mistakes <= 1:
            if consecutive_successes >= 1:  # 2 consecutive strong sessions
                if curr < DDAEngine.MAX_DIFFICULTY:
                    next_diff = curr + 1
                    adjustment = "INCREASED"
                    rationale = f"Outstanding performance ({performance_score:.1f}% score, {acc:.0f}% accuracy). Advancing to challenge level {next_diff}."
                else:
                    adjustment = "STABLE"
                    rationale = f"Player has mastered maximum level {curr} with exemplary {performance_score:.1f}% performance score."
            else:
                adjustment = "STABLE"
                rationale = f"Strong performance ({performance_score:.1f}%). Maintaining level {curr} to solidify consistency."

        # Condition for Easing Difficulty:
        # Struggling with high mistakes (>= 3) or low performance (< 48%) or low accuracy (< 50%)
        elif performance_score < 48.0 or acc < 50.0 or mistakes >= 3:
            if curr > DDAEngine.MIN_DIFFICULTY:
                next_diff = curr - 1
                adjustment = "EASED"
                rationale = f"Adjustment applied to reduce cognitive strain (Mistakes: {mistakes}, Accuracy: {acc:.0f}%). Easing to level {next_diff} for comfort."
            else:
                adjustment = "STABLE"
                rationale = f"Maintaining base level {curr}. Offering supportive visual cues and unlimited time hints."

        # Stable Zone
        else:
            adjustment = "STABLE"
            rationale = f"Consistent and balanced performance ({performance_score:.1f}%). Retaining level {curr} for optimal engagement."

        return DDAResult(
            current_difficulty=curr,
            next_difficulty=next_diff,
            adjustment=adjustment,
            rationale=rationale,
            calculated_performance=performance_score
        )
