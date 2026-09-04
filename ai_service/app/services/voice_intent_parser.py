import re
from ..models.recommendation import VoiceIntentRequest, VoiceIntentResponse

class VoiceIntentParser:
    """
    Rule and NLP-based voice intent parser for elderly voice interactions.
    Supports English, Hindi transliterated phrases, and core action intents.
    """

    PATTERNS = {
        "ACKNOWLEDGE_REMINDER": [
            r"\b(took|taken|done|had|finished|ate)\b.*\b(medicine|pill|tablet|water|dawai|goli)\b",
            r"\b(maine|mai)\b.*\b(dawai|goli|medicine)\b.*\b(le li|kha li|pee li)\b",
            r"\b(medicine|dawai|pill)\b.*\b(done|ho gayi)\b",
            r"\b(i did it|mark as done|taken|maine le liya)\b"
        ],
        "START_GAME": [
            r"\b(play|start|open|launch)\b.*\b(game|exercise|memory|harvest|blossom|memories|trivia|khel)\b",
            r"\b(memory|blossom|harvest|golden|memories|khel|game)\b.*\b(shuru|khelo|lagao|chalao|play|start|trivia)\b",
            r"\b(khel|game)\b.*\b(shuru|khelo|lagao|chalao)\b",
            r"\b(brain game|memory game|dimag ka khel)\b"
        ],
        "GET_SCHEDULE": [
            r"\b(what|tell me|show)\b.*\b(schedule|routine|today|reminders|plan)\b",
            r"\b(aaj kya karna hai|aaj ka schedule|meri dawai)\b",
            r"\b(remind me|what time|schedule)\b"
        ],
        "SOS_HELP": [
            r"\b(help|emergency|urgent|sos|bachao|madad)\b",
            r"\b(call doctor|call my son|call daughter|call caregiver)\b"
        ]
    }

    @staticmethod
    def parse_intent(req: VoiceIntentRequest) -> VoiceIntentResponse:
        text = req.text.strip().lower()
        if not text:
            return VoiceIntentResponse(
                raw_query="",
                intent="UNKNOWN",
                confidence=0.0,
                entities={}
            )

        for intent, patterns in VoiceIntentParser.PATTERNS.items():
            for pat in patterns:
                if re.search(pat, text):
                    entities = {}
                    if "memory" in text or "blossom" in text:
                        entities["game_id"] = "memory_blossom"
                    elif "harvest" in text or "fruit" in text:
                        entities["game_id"] = "quick_harvest"
                    elif "trivia" in text or "reminiscence" in text or "golden" in text:
                        entities["game_id"] = "golden_memories"

                    return VoiceIntentResponse(
                        raw_query=req.text,
                        intent=intent,
                        confidence=0.92,
                        entities=entities
                    )

        return VoiceIntentResponse(
            raw_query=req.text,
            intent="UNKNOWN",
            confidence=0.20,
            entities={}
        )
