from langgraph.graph import StateGraph, END
from google import genai
from sqlalchemy.orm import Session

from app.agents.graph_state import GraphState
from app.agents.safety_agent.safety_agent import SafetyAgent
from app.agents.appointment_agent.appointment_agent import AppointmentAgent
from app.agents.response_agent.response_agent import ResponseAgent
from app.services.rag_service import answer_from_knowledge_base
from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)


# ---- NODE FUNCTIONS ----
# Each node takes the current state, does its job, and returns updates to merge in.

def safety_node(state: GraphState) -> dict:
    check = SafetyAgent.check_for_emergency(state["message"])
    if check["is_emergency"]:
        return {"is_emergency": True, "final_response": check["response"]}
    return {"is_emergency": False}


def router_node(state: GraphState) -> dict:
    """Uses Gemini to classify intent: rag, appointment, or general."""
    prompt = f"""Classify the patient's message into exactly one category:
- "rag" — if they're asking a medical/health question (symptoms, medications, conditions)
- "appointment" — if they want to book, check, or cancel an appointment
- "general" — anything else (greetings, small talk, unclear requests)

Message: "{state['message']}"

Respond with ONLY one word: rag, appointment, or general."""

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt

    )
    intent = response.text.strip().lower()

    if intent not in ("rag", "appointment", "general"):
        intent = "general"  # safe fallback if the model says something unexpected

    return {"intent": intent}


def rag_node(state: GraphState) -> dict:
    result = answer_from_knowledge_base(state["message"])
    return {
        "retrieved_context": ", ".join(result["sources"]),
        "final_response": result["answer"]
    }


def appointment_node(state: GraphState) -> dict:
    """Extract doctor and date from natural language and book the appointment."""
    prompt = f"""Extract appointment details from this message and return ONLY a JSON object.
If you cannot find a doctor name or date/time, set them to null.

Message: "{state['message']}"

Return ONLY this JSON, nothing else:
{{
  "doctor": "doctor name or null",
  "datetime": "ISO format datetime like 2026-08-02T14:00:00 or null"
}}"""

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        import json, re
        text = response.text.strip()
        # Strip markdown if present
        text = re.sub(r"```json|```", "", text).strip()
        data = json.loads(text)

        doctor = data.get("doctor")
        datetime_str = data.get("datetime")

        if not doctor or not datetime_str:
            return {
                "final_response": (
                    "I'd love to book that for you! Could you provide:\n"
                    "• Doctor's name\n"
                    "• Preferred date and time"
                )
            }

        # Now actually book it using the DB
        from app.db.database import SessionLocal
        from app.agents.appointment_agent.appointment_agent import AppointmentAgent
        from datetime import datetime

        db = SessionLocal()
        try:
            appointment_datetime = datetime.fromisoformat(datetime_str)

            available = AppointmentAgent.is_slot_available(db, doctor, appointment_datetime)
            if not available:
                return {
                    "final_response": (
                        f"Sorry, {doctor} is not available at that time — "
                        f"there's already an appointment within 30 minutes of your requested slot. "
                        f"Please try a different time."
                    )
                }

            appointment = AppointmentAgent.book_appointment(
                db, state["patient_id"], doctor, appointment_datetime
            )

            return {
                "final_response": (
                    f"✅ Appointment booked successfully!\n\n"
                    f"👨‍⚕️ Doctor: {doctor}\n"
                    f"📅 Date: {appointment_datetime.strftime('%B %d, %Y')}\n"
                    f"🕐 Time: {appointment_datetime.strftime('%I:%M %p')}\n"
                    f"📋 Status: Scheduled\n"
                    f"🆔 Appointment ID: {appointment.id}"
                )
            }
        finally:
            db.close()

    except Exception as e:
        return {
            "final_response": (
                "I understood you want to book an appointment. "
                "Could you clarify the doctor's name and preferred date/time? "
                "For example: 'Book appointment with Dr. Sara on August 2nd at 2 PM'"
            )
        }

def general_node(state: GraphState) -> dict:
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=f"You are a friendly healthcare assistant. Respond briefly to: {state['message']}"
    )
    return {"final_response": response.text}


def response_node(state: GraphState) -> dict:
    return ResponseAgent.finalize(dict(state))


# ---- ROUTING LOGIC ----

def route_after_safety(state: GraphState) -> str:
    return "end" if state["is_emergency"] else "router"


def route_after_intent(state: GraphState) -> str:
    return state["intent"]  # "rag", "appointment", or "general"


# ---- BUILD THE GRAPH ----

def build_graph():
    graph = StateGraph(GraphState)

    graph.add_node("safety", safety_node)
    graph.add_node("router", router_node)
    graph.add_node("rag", rag_node)
    graph.add_node("appointment", appointment_node)
    graph.add_node("general", general_node)
    graph.add_node("response", response_node)

    graph.set_entry_point("safety")

    graph.add_conditional_edges(
        "safety",
        route_after_safety,
        {"end": END, "router": "router"}
    )

    graph.add_conditional_edges(
        "router",
        route_after_intent,
        {"rag": "rag", "appointment": "appointment", "general": "general"}
    )

    graph.add_edge("rag", "response")
    graph.add_edge("appointment", "response")
    graph.add_edge("general", "response")
    graph.add_edge("response", END)

    return graph.compile()


# Compiled once, reused across requests
medsync_graph = build_graph()