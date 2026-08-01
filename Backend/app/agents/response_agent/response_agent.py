class ResponseAgent:
    """Finalizes the response before it's sent back and saved to memory."""

    @staticmethod
    def finalize(state: dict) -> dict:
        # For now this is a pass-through, but this is the natural place to add
        # disclaimers, formatting, tone adjustments, etc. later.
        if not state.get("final_response"):
            state["final_response"] = "I'm not sure how to help with that yet."
        return state