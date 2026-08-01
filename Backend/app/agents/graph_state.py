from typing import TypedDict, Optional


class GraphState(TypedDict):
    patient_id: int
    message: str
    is_emergency: bool
    intent: Optional[str]       # "rag", "appointment", "general"
    retrieved_context: Optional[str]
    final_response: Optional[str]