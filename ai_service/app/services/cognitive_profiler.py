from typing import Dict
from ..models.telemetry import SessionTelemetry

class CognitiveProfiler:
    """
    Maintains the 5-Domain Cognitive Activity Profile:
    1. Working Memory
    2. Processing Speed
    3. Attention
    4. Executive Flexibility
    5. Reminiscence
    Strictly non-diagnostic tracking of task capability.
    """

    # Game to primary/secondary domain mappings
    DOMAIN_MAPPINGS = {
        "memory_blossom": {
            "primary": "working_memory",
            "secondary": "attention"
        },
        "quick_harvest": {
            "primary": "processing_speed",
            "secondary": "attention"
        },
        "golden_memories": {
            "primary": "reminiscence",
            "secondary": "executive_flexibility"
        }
    }

    @staticmethod
    def update_profile(
        current_profile: Dict[str, float],
        session: SessionTelemetry,
        session_performance: float
    ) -> Dict[str, float]:
        """
        Updates domain scores using an Exponential Moving Average (EMA) with alpha=0.25.
        Prevents jitter while capturing genuine trends over time.
        """
        updated = dict(current_profile)
        mapping = CognitiveProfiler.DOMAIN_MAPPINGS.get(session.game_id, {
            "primary": "working_memory",
            "secondary": "attention"
        })

        primary_domain = mapping["primary"]
        secondary_domain = mapping["secondary"]

        alpha_primary = 0.30
        alpha_secondary = 0.15

        # Update primary domain
        current_primary = updated.get(f"{primary_domain}_score", 50.0)
        updated[f"{primary_domain}_score"] = round(
            (1.0 - alpha_primary) * current_primary + alpha_primary * session_performance, 2
        )

        # Update secondary domain (softer effect)
        current_secondary = updated.get(f"{secondary_domain}_score", 50.0)
        updated[f"{secondary_domain}_score"] = round(
            (1.0 - alpha_secondary) * current_secondary + alpha_secondary * session_performance, 2
        )

        # Re-compute overall activity performance score
        domain_keys = [
            "working_memory_score",
            "processing_speed_score",
            "attention_score",
            "executive_flexibility_score",
            "reminiscence_score"
        ]
        overall = sum(updated.get(k, 50.0) for k in domain_keys) / len(domain_keys)
        updated["overall_performance_score"] = round(overall, 2)

        return updated
