import os
import json
import pandas as pd

def run_verification():
    print("=== Running Comprehensive Teammate Verification Suite ===")

    # Check 1: CSV dataset 300kW jump
    csv_path = "historical_training_campus_data.csv"
    assert os.path.exists(csv_path), "CSV dataset does not exist!"
    df = pd.read_csv(csv_path)
    df['Datetime'] = pd.to_datetime(df['Datetime'])
    
    # Filter 06:00 AM on Jan 2 2017
    row_0545 = df[df['Datetime'] == '2017-01-02 05:45:00'].iloc[0]
    row_0600 = df[df['Datetime'] == '2017-01-02 06:00:00'].iloc[0]
    
    jump_kw = row_0600['total_kw'] - row_0545['total_kw']
    print(f"Check 1A (CSV 06:00 AM Jump): 05:45 AM = {row_0545['total_kw']} kW, 06:00 AM = {row_0600['total_kw']} kW. Jump = {jump_kw:.2f} kW")
    assert jump_kw > 300.0, f"Expected jump > 300 kW, got {jump_kw:.2f} kW!"

    # Check 1B: Seed JSON dataset
    json_path = "packages/contracts/seed/seed_facility_data.json"
    assert os.path.exists(json_path), "Seed JSON does not exist!"
    with open(json_path, 'r') as f:
        seed_data = json.load(f)
    
    # Find 06:00 record in seed JSON
    rec_0600 = next(item for item in seed_data if '2017-01-02T06:00:00' in item['Datetime'])
    print(f"Check 1B (Seed JSON 06:00 AM): total_kw = {rec_0600['total_kw']} kW, is_spike_event = {rec_0600['is_spike_event']}")
    assert rec_0600['total_kw'] > 700.0, "Seed JSON total_kw at 06:00 AM should be > 700 kW!"
    assert rec_0600['is_spike_event'] == 1, "Seed JSON is_spike_event should be 1!"

    # Check 1C & 3: Recommendation rec_042.json fixture & contract model
    rec_path = "packages/contracts/seed/rec_042.json"
    assert os.path.exists(rec_path), "rec_042.json does not exist!"
    with open(rec_path, 'r') as f:
        rec_obj = json.load(f)
    
    print(f"Check 1C & 3 (Recommendation Contract): ID={rec_obj['id']}, Type={rec_obj['type']}, Confidence={rec_obj['confidence']}, Savings=Rs.{rec_obj['estimated_savings_inr']}, Post-Opt Peak={rec_obj['optimized_peak_kw']} kW")
    assert rec_obj['type'] == 'composite', "Type must be composite!"
    assert rec_obj['confidence'] == 0.94, "Confidence must be 0.94!"
    assert len(rec_obj['actions']) == 3, "Actions list must have 3 sub-actions!"
    assert rec_obj['estimated_savings_inr'] == 130000.0, "Savings must be Rs 1,30,000!"
    assert rec_obj['optimized_peak_kw'] == 420.0, "Optimized peak must be 420.0 kW!"

    # Test Pydantic model validation
    from packages.contracts.models import RecommendationObject
    pydantic_obj = RecommendationObject(**rec_obj)
    print(f"Pydantic Contract Validation: SUCCESS! Validated ID '{pydantic_obj.id}' with type '{pydantic_obj.type}' and confidence {pydantic_obj.confidence}")

    print("\nALL VERIFICATION CHECKS PASSED 100% CLEANLY!")

if __name__ == "__main__":
    run_verification()
