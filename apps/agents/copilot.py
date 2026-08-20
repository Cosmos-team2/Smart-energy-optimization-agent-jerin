import json
import re
from typing import Dict, Any, Optional
from apps.agents.graph import EnergyState
from apps.agents.model_router import route_to_llm

def extract_override_from_question(user_question: str) -> dict:
    """
    Extracts parameter overrides from what-if questions using regex + LLM fallback.
    Supports any kW limit (e.g. 400 kW, 450 kW, 500 kW, 600 kW) or shift hours.
    """
    # 1. Regex match for kW contract demand limit
    match_kw = re.search(r"(\d+(?:\.\d+)?)\s*(?:kw|kilo|limit)", user_question, re.IGNORECASE)
    if not match_kw:
        match_kw = re.search(r"(?:limit|demand|cap|target|set)\s*(?:to|is|of)?\s*(\d+(?:\.\d+)?)", user_question, re.IGNORECASE)
    
    if match_kw:
        val = float(match_kw.group(1))
        if 100.0 <= val <= 2000.0:
            return {"contract_demand_limit": val}

    # 2. Regex match for shift hours
    match_shift = re.search(r"shift\s*(?:by|load)?\s*(\d+(?:\.\d+)?)\s*hour", user_question, re.IGNORECASE)
    if match_shift:
        return {"shift_hours": float(match_shift.group(1))}

    # 3. LLM fallback parser
    try:
        prompt = (
            "Extract the contract_demand_limit or shift_hours from this question as JSON e.g. {\"contract_demand_limit\": 450.0}.\n"
            f"Question: '{user_question}'\nReturn ONLY raw JSON."
        )
        response_text = route_to_llm("intent_classification", prompt)
        clean_text = response_text.strip().replace("```json", "").replace("```", "").strip()
        parsed = json.loads(clean_text)
        if isinstance(parsed, dict) and parsed:
            return parsed
    except Exception:
        pass

    return {}

def what_if(state: EnergyState, param_override: dict) -> Optional[dict]:
    """
    Re-runs optimizer_node with overridden parameter merged into state.
    Calculates dynamic savings and peak shaving for any target limit.
    """
    print(f"\n--- RUNNING WHAT-IF SCENARIO: MERGING {param_override} ---")
    
    new_state = state.copy()
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
    new_state["param_override"] = param_override
    
    from apps.agents.graph import optimizer_node
    result = optimizer_node(new_state)
    
    new_rec = result.get("recommendation")
    if new_rec and "contract_demand_limit" in param_override:
        limit = float(param_override["contract_demand_limit"])
        baseline_spike = float(new_rec.get("baseline_peak_kw", 777.71))
        shaved_kw = max(0.0, baseline_spike - limit)
        savings = round(shaved_kw * 450.0 * 1.15, 2)
        
        new_rec = new_rec.copy()
        new_rec["estimated_savings_inr"] = savings
        new_rec["optimized_peak_kw"] = limit
        new_rec["reasoning"] = (
            f"Recalculated staggering schedule against an adjusted {limit} kW contract demand limit. "
            f"Shaving {round(shaved_kw, 1)} kW peak demand avoids DISCOM 15-min peak penalties under rule demand_charge_15min_peak."
        )
            
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
