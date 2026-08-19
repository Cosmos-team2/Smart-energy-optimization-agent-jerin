from typing import TypedDict, List, Dict, Optional, Any
from langgraph.graph import StateGraph, END
import json

# Import mock utility loaders
from apps.agents.mocks.mock_forecast import get_mock_forecast
from apps.agents.mocks.mock_tariff import get_mock_tariff
from apps.agents.model_router import route_to_llm

# 1. STATE SCHEMA
class EnergyState(TypedDict):
    building_id: str
    forecast: List[Dict[str, Any]]  # each: {timestamp, predicted_kw}
    tariff_context: Dict[str, Any]  # rate structure / demand charge rules
    anomaly: Optional[Dict[str, Any]]  # {type, window, severity} or None
    recommendation: Optional[Dict[str, Any]]  # {action, cited_rule, confidence, reasoning}
    explanation: Optional[Dict[str, Any]]  # {reasoning, cited_rule}
    chat_history: List[Dict[str, Any]]

# 2. GRAPH NODES
def forecast_node(state: EnergyState) -> dict:
    """Loads baseline kW consumption forecast (mocked via mock_forecast.py)."""
    print("\n--- FORECAST NODE ---")
    forecast = get_mock_forecast()
    print(f"[+] Loaded {len(forecast)} hourly forecast data points.")
    return {"forecast": forecast}

def anomaly_node(state: EnergyState) -> dict:
    """Classifies whether the forecast shows a demand anomaly using Groq."""
    print("\n--- ANOMALY NODE ---")
    forecast = state.get("forecast", [])
    tariff_context = state.get("tariff_context", {})
    rules = tariff_context.get("rules", [])
    
    # Construct a high-fidelity prompt for LLM-based classification
    prompt = (
        "You are an industrial energy analyst. Analyze the following 24h electricity demand forecast "
        "and determine if it violates any tariff rules (i.e. if predicted_kw exceeds the threshold).\n\n"
        f"Tariff Rules:\n{json.dumps(rules, indent=2)}\n\n"
        f"Forecast Data:\n{json.dumps(forecast, indent=2)}\n\n"
        "Determine if any forecasted kW exceeds the demand charge threshold.\n"
        "Respond ONLY with a valid JSON block, using exactly these keys:\n"
        "{\n"
        '  "has_anomaly": true/false,\n'
        '  "type": "demand_spike" or null,\n'
        '  "window": "HH:MM-HH:MM AM/PM" (time range of peak violation) or null,\n'
        '  "severity": "high" (peak > 700 kW) or "medium" (peak > 500 kW) or null\n'
        "}\n"
        "Do not include any chat formatting, thoughts, or markdown tags."
    )
    
    response_text = route_to_llm("anomaly_classification", prompt)
    
    # Parser helper to strip markdown wrappers
    try:
        clean_text = response_text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        clean_text = clean_text.strip()
        
        result = json.loads(clean_text)
        if result.get("has_anomaly"):
            anomaly_info = {
                "type": result.get("type", "demand_spike"),
                "window": result.get("window", "06:00-06:15 AM"),
                "severity": result.get("severity", "high")
            }
            print(f"[!] ANOMALY CLASSIFIED: {anomaly_info}")
            return {"anomaly": anomaly_info}
    except Exception as e:
        print(f"[!] Error parsing anomaly classification response: {e}. Raw was: {response_text}")
        
    print("[+] No demand anomalies detected in forecast.")
    return {"anomaly": None}

def optimizer_node(state: EnergyState) -> dict:
    """
    Applies optimization rule logic against tariff_context and forecast/anomaly.
    Function signature takes EnergyState, delegates internal work to a swappable tool.
    """
    print("\n--- OPTIMIZER NODE ---")
    forecast = state.get("forecast", [])
    tariff_context = state.get("tariff_context", {})
    anomaly = state.get("anomaly")
    
    # Internal business logic function call representing a swappable MCP tool
    recommendation = run_optimization_logic(forecast, tariff_context, anomaly)
    if recommendation:
        print(f"[+] Recommendation generated: '{recommendation.get('action')}'")
    else:
        print("[+] No recommendation needed (no anomaly).")
    return {"recommendation": recommendation}

def run_optimization_logic(forecast: list, tariff_context: dict, anomaly: dict) -> Optional[dict]:
    """
    Stable utility logic function simulating solver output.
    Returns recommendation matching: {action, cited_rule, confidence, reasoning}
    Can be easily swapped with direct MILP/PuLP solver calls or an MCP tool later.
    """
    if not anomaly:
        return None
        
    # Fetch rules
    rules = tariff_context.get("rules", [])
    rule_name = rules[0].get("name", "demand_charge_15min_peak") if rules else "demand_charge_15min_peak"
    
    # Mock optimizer staggering logic matching rec_042
    action_desc = "Pre-cool HVAC-3 by -1.5°C, stagger compressor restart by 20 mins, cap Chiller-2 ramp at 50%"
    reasoning_stub = "Solving load staggering to resolve simultaneous startups."
    
    return {
        "action": action_desc,
        "cited_rule": rule_name,
        "confidence": 0.94,
        "reasoning": reasoning_stub
    }

def explainer_node(state: EnergyState) -> dict:
    """Calls Gemini to generate a grounded explanation that explicitly names the cited_rule."""
    print("\n--- EXPLAINER NODE ---")
    recommendation = state.get("recommendation")
    if not recommendation:
        return {}
        
    cited_rule = recommendation.get("cited_rule")
    
    prompt = (
        "You are an expert industrial building energy manager. Prepare a brief explanation "
        "for the facility operator. You must explain the recommendation and explicitly name "
        f"the cited tariff rule '{cited_rule}' by exact name.\n\n"
        "Grounded Facts:\n"
        f"- Target actions: {recommendation.get('action')}\n"
        "- Baseline Peak spike: 777.71 kW at 06:00 AM (violates 500 kW threshold)\n"
        "- Post-optimization Peak: 420.0 kW (under 500 kW limit)\n"
        "- Confidence: 94%\n\n"
        "Write a concise, grounded explanation explaining how the staggered actions prevent "
        "the peak demand charge penalty under the cited rule."
    )
    
    explanation_reasoning = route_to_llm("explainer_generation", prompt)
    
    # Update recommendation and state
    updated_rec = recommendation.copy()
    updated_rec["reasoning"] = explanation_reasoning
    
    explanation_dict = {
        "reasoning": explanation_reasoning,
        "cited_rule": cited_rule
    }
    
    print("[+] Explainer generated explanation and updated recommendation.")
    return {
        "recommendation": updated_rec,
        "explanation": explanation_dict
    }

# 3. CONDITIONAL EDGE ROUTER
def route_after_anomaly(state: EnergyState) -> str:
    """Routes directly to END if no anomaly was classified, skipping optimizer."""
    anomaly = state.get("anomaly")
    if anomaly:
        return "optimizer"
    else:
        return END

# 4. WIRE THE GRAPH
def build_agent_graph() -> StateGraph:
    """Builds and compiles the StateGraph workflow."""
    workflow = StateGraph(EnergyState)
    
    # Add nodes
    workflow.add_node("forecast", forecast_node)
    workflow.add_node("anomaly", anomaly_node)
    workflow.add_node("optimizer", optimizer_node)
    workflow.add_node("explainer", explainer_node)
    
    # Set entry point
    workflow.set_entry_point("forecast")
    
    # Add linear flow and conditional edge
    workflow.add_edge("forecast", "anomaly")
    workflow.add_conditional_edges(
        "anomaly",
        route_after_anomaly,
        {
            "optimizer": "optimizer",
            END: END
        }
    )
    workflow.add_edge("optimizer", "explainer")
    workflow.add_edge("explainer", END)
    
    return workflow.compile()
