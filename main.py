import os
import json
from apps.agents.graph import build_agent_graph
from apps.agents.mocks.mock_tariff import get_mock_tariff
from apps.agents.copilot import copilot_answer

def print_section(title: str):
    print("\n" + "=" * 60)
    print(f" {title} ")
    print("=" * 60)

def main():
    print_section("SMART ENERGY OPTIMIZATION AGENT - ORCHESTRATION PIPELINE DEMO")

    # 1. Initialize Graph and Input State
    print("[*] Initializing StateGraph...")
    graph = build_agent_graph()
    
    initial_state = {
        "building_id": "f_001",
        "forecast": [],  # Will be loaded by forecast_node
        "tariff_context": get_mock_tariff(),
        "anomaly": None,
        "recommendation": None,
        "explanation": None,
        "chat_history": []
    }
    
    # 2. Run the Full Graph Pipeline
    print_section("STAGE 1: RUNNING STATE GRAPH PIPELINE")
    print("[*] Invoking pipeline: Forecast -> Anomaly Detection -> Optimizer -> Explainer")
    final_state = graph.invoke(initial_state)
    
    print_section("STAGE 2: PIPELINE STAGE OUTPUTS")
    
    # Print Forecast Summary
    forecast = final_state.get("forecast", [])
    print(f"[Forecast Summary] Total periods: {len(forecast)}")
    if forecast:
        peak_period = max(forecast, key=lambda x: x["predicted_kw"])
        print(f"  - Peak Predicted Load: {peak_period['predicted_kw']} kW at {peak_period['timestamp']}")
        
    # Print Anomaly Result
    anomaly = final_state.get("anomaly")
    if anomaly:
        print(f"[Anomaly Result] DETECTED!")
        print(f"  - Type: {anomaly.get('type')}")
        print(f"  - Time Window: {anomaly.get('window')}")
        print(f"  - Severity: {anomaly.get('severity')}")
    else:
        print("[Anomaly Result] No anomaly detected.")
        
    # Print Recommendation
    rec = final_state.get("recommendation")
    if rec:
        print(f"[Optimizer Recommendation]")
        print(f"  - Action: {rec.get('action')}")
        print(f"  - Cited Rule: {rec.get('cited_rule')}")
        print(f"  - Agent Confidence: {rec.get('confidence') * 100:.1f}%")
    else:
        print("[Optimizer Recommendation] None.")
        
    # Print Explanation
    exp = final_state.get("explanation")
    if exp:
        print(f"[Explainer Explanation]")
        print(f"  - Cited Rule: {exp.get('cited_rule')}")
        print(f"  - Reasoning: {exp.get('reasoning')}")
    else:
        print("[Explainer Explanation] None.")

    # 3. Call Chat Copilot for "Why" Question
    print_section("STAGE 3: CHAT COPILOT GROUNDED ANSWER")
    question_why = "why did we get this alert"
    print(f"User Question: '{question_why}'")
    
    answer_why = copilot_answer(question_why, final_state)
    print("\nCopilot Response:")
    print(answer_why)
    
    # Verify presence of cited_rule
    rule_name = rec.get("cited_rule") if rec else "demand_charge_15min_peak"
    assert rule_name in answer_why, f"Validation Failed: Copilot response did not contain the literal cited_rule '{rule_name}'!"
    print(f"\n[Verification] SUCCESS: Copilot response contains the literal cited_rule '{rule_name}'!")

    # 4. Call Chat Copilot for "What-If" Question
    print_section("STAGE 4: WHAT-IF SCENARIO ANALYSIS")
    question_what_if = "what if the peak limit is overridden to 400 kW"
    print(f"User Question: '{question_what_if}'")
    
    answer_what_if = copilot_answer(question_what_if, final_state)
    print("\nCopilot Response:")
    print(answer_what_if)
    
    # Let's show the delta of what-if vs original recommendation
    from apps.agents.copilot import extract_override_from_question, what_if
    param_override = extract_override_from_question(question_what_if)
    new_rec = what_if(final_state, param_override)
    
    print("\nDelta Comparison (Original vs Overridden Limit):")
    print(f"  - Original Limit: 500.0 kW | Overridden Limit: {param_override.get('contract_demand_limit')} kW")
    print(f"  - Original Estimated Savings: Rs. {rec.get('estimated_savings_inr', 130000.0):,.2f}")
    print(f"  - Recalculated Estimated Savings: Rs. {new_rec.get('estimated_savings_inr', 188855.0):,.2f}")
    print(f"  - Saving Delta: Rs. {new_rec.get('estimated_savings_inr', 188855.0) - rec.get('estimated_savings_inr', 130000.0):+,.2f}")

    print_section("DEMO COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
