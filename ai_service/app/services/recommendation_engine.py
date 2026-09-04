from typing import List
from ..models.recommendation import (
    RecommendationRequest,
    RecommendationResponse,
    RecommendedActivity
)

class RecommendationEngine:
    """
    Transparent cognitive exercise recommender.
    Selects exercises based on current activity profile domains to provide
    balanced stimulation across memory, attention, and reminiscing.
    """

    ACTIVITIES = {
        "WORKING_MEMORY": {
            "game_id": "memory_blossom",
            "title": "Memory Blossom",
            "domain": "WORKING_MEMORY",
            "duration": 5
        },
        "PROCESSING_SPEED": {
            "game_id": "quick_harvest",
            "title": "Quick Harvest",
            "domain": "PROCESSING_SPEED",
            "duration": 4
        },
        "REMINISCENCE": {
            "game_id": "golden_memories",
            "title": "Golden Memories",
            "domain": "REMINISCENCE",
            "duration": 6
        },
        "ATTENTION": {
            "game_id": "pattern_path",
            "title": "Pattern Path",
            "domain": "ATTENTION",
            "duration": 5
        },
        "EXECUTIVE_FLEXIBILITY": {
            "game_id": "sort_remember",
            "title": "Sort & Remember",
            "domain": "EXECUTIVE_FLEXIBILITY",
            "duration": 5
        }
    }

    @staticmethod
    def generate_recommendations(req: RecommendationRequest) -> RecommendationResponse:
        domain_scores = {
            "WORKING_MEMORY": req.working_memory_score,
            "PROCESSING_SPEED": req.processing_speed_score,
            "ATTENTION": req.attention_score,
            "REMINISCENCE": req.reminiscence_score,
            "EXECUTIVE_FLEXIBILITY": getattr(req, "executive_flexibility_score", 50.0)
        }

        # Find the domain with lowest score for targeted practice
        sorted_domains = sorted(domain_scores.items(), key=lambda x: x[1])
        target_domain_key = sorted_domains[0][0]

        primary_domain = target_domain_key if target_domain_key in RecommendationEngine.ACTIVITIES else "PROCESSING_SPEED"
        primary_meta = RecommendationEngine.ACTIVITIES[primary_domain]

        # Calculate suggested difficulty based on that domain's score
        domain_score = domain_scores.get(primary_domain, 50.0)
        if domain_score >= 80.0:
            suggested_diff = 3
        elif domain_score >= 60.0:
            suggested_diff = 2
        else:
            suggested_diff = 1

        primary_rec = RecommendedActivity(
            game_id=primary_meta["game_id"],
            title=primary_meta["title"],
            target_domain=primary_domain,
            suggested_difficulty=suggested_diff,
            rationale=(
                f"Recommended based on your recent activity scores ({domain_score:.1f}/100 in {primary_domain.replace('_', ' ').title()}). "
                f"Engaging with {primary_meta['title']} helps reinforce this activity area."
            ),
            estimated_minutes=primary_meta["duration"]
        )

        # Create balanced 3-part daily routine
        daily_schedule = [
            RecommendedActivity(
                game_id="memory_blossom",
                title="Morning Memory Blossom",
                target_domain="WORKING_MEMORY",
                suggested_difficulty=2 if req.working_memory_score >= 60 else 1,
                rationale="Morning sequence stimulation to activate focus for the day.",
                estimated_minutes=5
            ),
            RecommendedActivity(
                game_id="quick_harvest",
                title="Midday Quick Harvest",
                target_domain="PROCESSING_SPEED",
                suggested_difficulty=2 if req.processing_speed_score >= 60 else 1,
                rationale="Afternoon reaction exercise to stay alert and energized.",
                estimated_minutes=4
            ),
            RecommendedActivity(
                game_id="golden_memories",
                title="Evening Golden Memories",
                target_domain="REMINISCENCE",
                suggested_difficulty=2,
                rationale="Relaxing evening reminiscing with pleasant cultural and musical trivia.",
                estimated_minutes=6
            )
        ]

        wellness_note = (
            "Consistency is key to positive cognitive health. Take your time, enjoy each exercise, "
            "and remember to stay hydrated."
        )

        return RecommendationResponse(
            patient_id=req.patient_id,
            primary_recommendation=primary_rec,
            daily_schedule_suggestions=daily_schedule,
            wellness_note=wellness_note
        )
