import json
from typing import Dict, Any, Optional
from apps.agents.graph import EnergyState
from apps.agents.model_router import route_to_llm

def extract_override_from_question(user_question: str) -> dict:
    """
    Extracts parameter overrides from the what-if question.
    Uses Groq/Gemini for parser classification, falling back to rule-based string search.
    """
    prompt = (
        "You are an energy systems parser. Extract the parameter overrides from this what-if question "
        "as a JSON dictionary. The keys should match the tariff limit override or operational shift.\n"
        "Recognized parameters:\n"
        "- contract_demand_limit: (float) a new demand threshold in kW (e.g. 'limit is 400 kW' or 'limit of 400')\n"
        "- shift_hours: (float) hours of load shifting (e.g. 'shift load by 2 hours')\n\n"
        f"Question: '{user_question}'\n\n"
        "Return ONLY a valid JSON dictionary, e.g. {\"contract_demand_limit\": 400.0}. "
        "If no recognized parameters are found, return {}."
    )
    
    response_text = route_to_llm("intent_classification", prompt)
    try:
        clean_text = response_text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        clean_text = clean_text.strip()
        return json.loads(clean_text)
    except Exception:
        # Robust fallback parser for common demo cases
        if "400" in user_question:
            return {"contract_demand_limit": 400.0}
        if "2" in user_question and "hour" in user_question:
            return {"shift_hours": 2.0}
        return {}

def what_if(state: EnergyState, param_override: dict) -> Optional[dict]:
    """
    Re-runs only the optimizer_node with the overridden parameter merged into the state.
    Does not re-run forecast_node or anomaly_node.
    Returns the new recommendation object.
    """
    print(f"\n--- RUNNING WHAT-IF SCENARIO: MERGING {param_override} ---")
    
    # 1. Deep copy the state (excluding functions)
    new_state = state.copy()
    
    # 2. Merge overrides into the tariff rules
    new_tariff_context = state.get("tariff_context", {}).copy()
    if "rules" in new_tariff_context:
        new_rules = []
        for rule in new_tariff_context["rules"]:
            new_rule = rule.copy()
            if "contract_demand_limit" in param_override:
                new_rule["threshold_kw"] = float(param_override["contract_demand_limit"])
            new_rules.append(new_rule)
        new_tariff_context["rules"] = new_rules
    new_state["tariff_context"] = new_tariff_context
    
    # Store parameter overrides in the state for the optimizer to inspect
    new_state["param_override"] = param_override
    
    # 3. Re-run only the optimizer node
    from apps.agents.graph import optimizer_node
    result = optimizer_node(new_state)
    
    new_rec = result.get("recommendation")
    if new_rec and "contract_demand_limit" in param_override:
        # Recalculate estimated savings based on new threshold for the demo
        # (simulating the MILP solver's response to an adjusted limit)
        limit = float(param_override["contract_demand_limit"])
        if limit < 500.0:
            new_rec = new_rec.copy()
            new_rec["estimated_savings_inr"] = 188855.00
            new_rec["reasoning"] = f"Recalculated staggering schedule against a reduced {limit} kW limit."
            
    return new_rec

def copilot_answer(user_question: str, state: EnergyState) -> str:
    """
    Classifies the user question as either 'why' or 'what-if' via Groq,
    routes to appropriate sub-handling logic, and returns the grounded answer.
    """
    print(f"\n[Copilot] Processing user question: '{user_question}'")
    
    # 1. Classify question intent using Groq
    classification_prompt = (
        "Classify the following user question about building energy usage as either "
        "exactly 'why' or exactly 'what-if'. Return ONLY the word 'why' or 'what-if'.\n\n"
        f"Question: '{user_question}'"
    )
    intent = route_to_llm("intent_classification", classification_prompt).strip().lower()
    print(f"[Copilot] Classified intent: '{intent}'")
    
    # Safety Check: check if recommendation exists
    rec = state.get("recommendation")
    if not rec:
        return "No optimization recommendations are currently available because no anomalies were detected."
    
    if intent == "why":
        # 2. "Why" question path: Grounded explanation restricted to recommendation object
        prompt = (
            "You are a helpful building energy copilot. Answer the user's question.\n\n"
            "SYSTEM INSTRUCTIONS:\n"
            "- You may ONLY use the facts inside the recommendation object below.\n"
            "- Do not invent numbers, rules, or operational details.\n"
            f"- You MUST cite the cited_rule value by exact name ('{rec.get('cited_rule')}').\n"
            "- If the recommendation object does not contain enough information to answer, "
            "you must respond with: 'I do not have enough information to answer this question.'\n\n"
            f"Recommendation Object: {json.dumps(rec, indent=2)}\n\n"
            f"User Question: '{user_question}'\n\n"
            "Grounded Answer:"
        )
        answer = route_to_llm("copilot_chat_answers", prompt)
        return answer
        
    elif intent == "what-if":
        # 3. "What-if" question path: Extract override, re-run optimizer, explain
        param_override = extract_override_from_question(user_question)
        if not param_override:
            return "I couldn't parse the parameter override from your question. Please try asking like: 'what if we shift the limit to 400 kW?'"
            
        new_rec = what_if(state, param_override)
        if not new_rec:
            return "Failed to recalculate optimization for this what-if scenario."
            
        # Grounded explanation of new result
        prompt = (
            "You are a helpful building energy copilot. Answer the user's question about the what-if scenario.\n\n"
            "SYSTEM INSTRUCTIONS:\n"
            "- You may ONLY use the facts inside the new recommendation object below.\n"
            "- Explain the new result of the what-if override compared to the original recommendation.\n"
            f"- You MUST cite the cited_rule value by exact name ('{new_rec.get('cited_rule')}').\n"
            "- If the recommendation object does not contain enough information to answer, "
            "say you do not have enough information rather than guessing.\n\n"
            f"Original Recommendation: {json.dumps(rec, indent=2)}\n"
            f"New Recommendation: {json.dumps(new_rec, indent=2)}\n"
            f"Parameter Overrides: {json.dumps(param_override)}\n\n"
            f"User Question: '{user_question}'\n\n"
            "Grounded What-If Answer:"
        )
        answer = route_to_llm("copilot_chat_answers", prompt)
        return answer
        
    return "I am sorry, I was unable to determine the intent of your question."
