# Keyword-based emergency detection — fast, deterministic, no LLM call needed
# for the critical safety check itself (important: we don't want safety detection
# to depend on an LLM that could hallucinate or be slow under load).

EMERGENCY_KEYWORDS = [
    "chest pain", "difficulty breathing", "can't breathe", "cannot breathe",
    "severe bleeding", "heavy bleeding", "unconscious", "not breathing",
    "suicidal", "want to die", "overdose", "seizure", "stroke",
    "severe allergic reaction", "anaphylaxis", "choking",
    "severe burn", "head injury", "loss of consciousness"
]

EMERGENCY_RESPONSE = (
    "⚠️ This may require immediate medical attention.\n\n"
    "Please contact emergency services (911 or your local emergency number) "
    "or go to the nearest emergency room right away. This assistant cannot "
    "provide emergency medical care."
)


class SafetyAgent:
    """Detects potentially dangerous symptoms in patient messages and flags for escalation."""

    @staticmethod
    def check_for_emergency(message: str) -> dict:
        message_lower = message.lower()
        matched_keywords = [kw for kw in EMERGENCY_KEYWORDS if kw in message_lower]

        is_emergency = len(matched_keywords) > 0

        return {
            "is_emergency": is_emergency,
            "matched_keywords": matched_keywords,
            "response": EMERGENCY_RESPONSE if is_emergency else None
        }