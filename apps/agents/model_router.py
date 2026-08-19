import os
import hashlib
import json
from dotenv import load_dotenv

# Load env variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# In-memory cache
# prompt_hash -> response_str
_prompt_cache = {}

def get_prompt_hash(prompt: str) -> str:
    """Returns SHA-256 hash of prompt string."""
    return hashlib.sha256(prompt.encode("utf-8")).hexdigest()

def call_groq(prompt: str, model: str = "llama3-8b-8192") -> str:
    """Invokes Groq API completion."""
    from groq import Groq
    client = Groq(api_key=GROQ_API_KEY)
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        model=model,
        temperature=0.0,
    )
    return chat_completion.choices[0].message.content.strip()

def call_gemini(prompt: str, model: str = "gemini-1.5-flash") -> str:
    """Invokes Google Gemini API completion."""
    import google.generativeai as genai
    genai.configure(api_key=GEMINI_API_KEY)
    model_instance = genai.GenerativeModel(model)
    response = model_instance.generate_content(prompt)
    return response.text.strip()

def get_mock_response(task_type: str, prompt: str) -> str:
    """Returns high-fidelity mock responses for testing without API keys."""
    if task_type == "anomaly_classification":
        if "777.71" in prompt or "777" in prompt:
            return json.dumps({
                "has_anomaly": True,
                "type": "demand_spike",
                "window": "06:00-06:15 AM",
                "severity": "high"
            })
        return json.dumps({
            "has_anomaly": False,
            "type": None,
            "window": None,
            "severity": None
        })
    elif task_type == "intent_classification":
        last_line = prompt.splitlines()[-1].lower() if prompt else ""
        if "what if" in last_line or "what-if" in last_line or "limit" in last_line:
            return "what-if"
        return "why"

    elif task_type == "explainer_generation":
        return ("Simultaneous startup of Chiller #2 (+180 kW) and Compressor #1 (+140 kW) "
                "creates a 777.71 kW demand spike between 06:00-06:15 AM, exceeding the 500.0 kW "
                "contract limit. Staggering compressor restart to 06:20 AM and pre-cooling Zone "
                "HVAC-3 reduces peak load to 420.0 kW. This optimization avoids high penalty rates "
                "stipulated under the rule 'demand_charge_15min_peak'.")
    elif task_type == "copilot_chat_answers":
        if "what if" in prompt.lower() or "what-if" in prompt.lower() or "overridden" in prompt.lower():
            limit = "400.0 kW"
            if "400" in prompt:
                limit = "400.0 kW"
            return (f"If the contract demand limit is overridden to {limit}, the baseline peak of 777.71 kW "
                    "at 06:00 AM still creates an anomaly. The optimizer applies staggering logic and reduces "
                    "the peak to 420.0 kW. Under the rule 'demand_charge_15min_peak', the new peak still "
                    "exceeds the overridden limit of 400.0 kW by 20.0 kW, but is significantly better than the "
                    "original spike. The estimated savings are adjusted to Rs. 1,88,855.00.")
        else:
            return ("We received this alert because simultaneous restart of Chiller #2 and Compressor #1 was "
                    "forecasted to cause a peak demand spike of 777.71 kW, which exceeds the contract limit of 500.0 kW. "
                    "To resolve this spike, the optimizer recommends pre-cooling Zone HVAC-3 and delaying Compressor #1 "
                    "restart by 20 minutes, shaving the peak to 420.0 kW. This optimization action is taken to comply with "
                    "the rule 'demand_charge_15min_peak' and will save an estimated Rs. 1,30,000.00 in monthly demand charges.")
    return "Mock response"

def route_to_llm(task_type: str, prompt: str) -> str:
    """
    Routes the prompt to either Groq or Gemini based on task type.
    Uses in-memory cache to skip API calls for duplicate prompts.
    """
    phash = get_prompt_hash(prompt)
    if phash in _prompt_cache:
        print(f"[Cache Hit] Returning cached response for task '{task_type}' (hash: {phash[:8]})")
        return _prompt_cache[phash]
    
    # Check if we should call the live API
    use_live_api = False
    if task_type in ["anomaly_classification", "intent_classification"]:
        if GROQ_API_KEY and GROQ_API_KEY.strip() and not GROQ_API_KEY.startswith("your_"):
            use_live_api = True
    else:
        if GEMINI_API_KEY and GEMINI_API_KEY.strip() and not GEMINI_API_KEY.startswith("your_"):
            use_live_api = True

    response_text = ""
    if use_live_api:
        try:
            if task_type in ["anomaly_classification", "intent_classification"]:
                response_text = call_groq(prompt)
            else:
                response_text = call_gemini(prompt)
        except Exception as e:
            print(f"[LLM Router Warning] Live API call failed: {e}. Falling back to Mock Mode.")
            response_text = get_mock_response(task_type, prompt)
    else:
        # Debug trace
        # print(f"[Mock Mode] Simulating response for task '{task_type}'")
        response_text = get_mock_response(task_type, prompt)

    # Store in cache
    _prompt_cache[phash] = response_text
    return response_text
