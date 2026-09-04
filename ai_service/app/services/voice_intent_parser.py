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
            r"\b(play|start|open|launch|chalo|aao)\b.*\b(game|exercise|memory|harvest|blossom|memories|trivia|khel|pattern|path|pair|pairs|match|sort|remember|story|stories)\b",
            r"\b(memory|blossom|harvest|golden|memories|khel|game|pattern|path|pair|pairs|match|sort|remember|story|stories)\b.*\b(shuru|khelo|khele|khelna|lagao|chalao|play|start|trivia)\b",
            r"\b(khel|game)\b.*\b(shuru|khelo|khele|khelna|lagao|chalao)\b",
            r"\b(brain game|memory game|dimag ka khel|pattern game)\b"
        ],
        "SEARCH": [
            r"\b(search|find|look for|dhundo|khojo|bicharok|khujo|thiba)\b(.*)",
            r"\b(kaha hai|kaha milega|search karo)\b"
        ],
        "GET_SCHEDULE": [
            r"\b(what|tell me|show)\b.*\b(schedule|routine|today|reminders|plan)\b",
            r"\b(aaj kya karna hai|aaj ka schedule|meri dawai)\b",
            r"\b(remind me|what time|schedule)\b"
        ],
        "GO_HOME": [
            r"\b(go home|home|return to home|dashboard|ghar chalo|ghar jao|mukhya prishta)\b",
            r"\b(main screen|home screen)\b"
        ],
        "HELP": [
            r"\b(help|instructions|how to use|kya karna hai|kaise khele|madad|sahayata|sos|emergency)\b",
            r"\b(call doctor|call my son|call daughter|call caregiver)\b"
        ],
        "SOS_HELP": [
            r"\b(sos|emergency|urgent|bachao)\b"
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
                match = re.search(pat, text)
                if match:
                    entities = {}
                    if intent == "START_GAME":
                        if "blossom" in text or "flower" in text:
                            entities["game_id"] = "memory_blossom"
                        elif "harvest" in text or "fruit" in text:
                            entities["game_id"] = "quick_harvest"
                        elif "trivia" in text or "reminiscence" in text or "golden" in text:
                            entities["game_id"] = "golden_memories"
                        elif "pattern" in text or "path" in text:
                            entities["game_id"] = "pattern_path"
                        elif "pair" in text or "match" in text:
                            entities["game_id"] = "match_pairs"
                        elif "sort" in text or "basket" in text:
                            entities["game_id"] = "sort_remember"
                        elif "story" in text or "stories" in text or "chai" in text:
                            entities["game_id"] = "sequence_stories"
                        elif "memory" in text:
                            entities["game_id"] = "memory_blossom"
                    elif intent == "SEARCH":
                        query_part = match.group(2).strip() if match.lastindex and match.lastindex >= 2 else text
                        # Clean common prepositions
                        query_part = re.sub(r"^(for|about|me|karo|ko)\s+", "", query_part).strip()
                        entities["query"] = query_part or text

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
