from app.agents.orchestrator import medsync_graph

test_cases = [
    "I have severe chest pain",
    "What are the side effects of metformin?",
    "I want to book an appointment with Dr. Sharma",
    "Hi, how are you?",
]

for message in test_cases:
    print(f"\n--- Input: {message} ---")
    result = medsync_graph.invoke({
        "patient_id": 1,
        "message": message,
        "is_emergency": False,
        "intent": None,
        "retrieved_context": None,
        "final_response": None,
    })
    print("Response:", result["final_response"])
    print("Intent:", result.get("intent"))