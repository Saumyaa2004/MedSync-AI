from sqlalchemy.orm import Session
from app.db.models import Conversation


class MemoryAgent:
    """Handles storing and retrieving a patient's conversation history."""

    @staticmethod
    def save_interaction(db: Session, patient_id: int, query: str, response: str) -> Conversation:
        conversation = Conversation(
            patient_id=patient_id,
            query=query,
            response=response
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        return conversation

    @staticmethod
    def get_recent_history(db: Session, patient_id: int, limit: int = 5) -> list[Conversation]:
        return (
            db.query(Conversation)
            .filter(Conversation.patient_id == patient_id)
            .order_by(Conversation.timestamp.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def format_history_for_prompt(history: list[Conversation]) -> str:
        """Turns conversation history into plain text the LLM can use as context."""
        if not history:
            return "No previous conversation history."

        lines = []
        for conv in reversed(history):  # oldest first, for natural reading order
            lines.append(f"Patient: {conv.query}")
            lines.append(f"Assistant: {conv.response}")
        return "\n".join(lines)