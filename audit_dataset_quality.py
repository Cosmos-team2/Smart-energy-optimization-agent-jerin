import pandas as pd
import numpy as np

def audit_dataset():
    print("=================================================================")
    print("       INDUSTRY-GRADE DATA QUALITY & ML LEAKAGE AUDIT REPORT      ")
    print("=================================================================")
    
    csv_path = "historical_training_campus_data.csv"
    df = pd.read_csv(csv_path)
    df['Datetime'] = pd.to_datetime(df['Datetime'])
    
    total_rows = len(df)
    print(f"\n[1] DATASET OVERVIEW & SIZE")
    print(f"    Total Rows: {total_rows}")
    print(f"    Total Columns: {len(df.columns)}")
    print(f"    Columns List: {list(df.columns)}")
    
    # 1. Timestamp Continuity & Frequency Audit
    print(f"\n[2] TIMESTAMP CONTINUITY & MONOTONICITY AUDIT")
    is_monotonic = df['Datetime'].is_monotonic_increasing
    duplicates = df['Datetime'].duplicated().sum()
    expected_range = pd.date_range(start=df['Datetime'].min(), end=df['Datetime'].max(), freq='15min')
    missing_timestamps = len(expected_range) - len(df)
    
    print(f"    Monotonic Increasing: {is_monotonic}")
    print(f"    Duplicate Timestamps: {duplicates}")
    print(f"    Expected 15-min Intervals: {len(expected_range)}")
    print(f"    Missing Intervals: {missing_timestamps}")
    
    # 2. Null, NaN, Inf Audit
    print(f"\n[3] NULL, MISSING & INFINITE VALUE AUDIT")
    null_counts = df.isnull().sum().to_dict()
    inf_counts = {col: np.isinf(df[col]).sum() for col in df.select_dtypes(include=np.number).columns}
    print(f"    Null Counts per Column: {null_counts}")
    print(f"    Inf Counts per Column: {inf_counts}")
    
    # 3. Physical Sanity & Boundary Checks
    print(f"\n[4] PHYSICAL SANITY & BOUNDARY CHECKS")
    numeric_cols = ['total_kw', 'hvac_kw', 'comp_kw', 'base_kw', 'temp_celsius', 'humidity_pct', 'solar_ghi']
    stats = df[numeric_cols].describe().T[['min', 'mean', 'max', 'std']]
    print(stats)
    
    # Sub-zone sum integrity check
    subzone_sum = (df['hvac_kw'] + df['comp_kw'] + df['base_kw']).round(2)
    sum_diff = (df['total_kw'] - subzone_sum).abs().max()
    print(f"    Sub-zone Sum Max Absolute Discrepancy: {sum_diff:.6f} kW")
    
    # 4. DISCOM Tariff Boundary Audit
    print(f"\n[5] DISCOM TARIFF RULES BOUNDARY AUDIT")
    hours = df['Datetime'].dt.hour
    off_peak_mask = (hours >= 22) | (hours < 6)
    normal_mask = (hours >= 6) & (hours < 18)
    peak_mask = (hours >= 18) & (hours < 22)
    
    off_peak_rate_match = (df.loc[off_peak_mask, 'tod_rate_inr'] == 6.50).all()
    normal_rate_match = (df.loc[normal_mask, 'tod_rate_inr'] == 8.00).all()
    peak_rate_match = (df.loc[peak_mask, 'tod_rate_inr'] == 10.50).all()
    
    print(f"    Off-Peak Tariff (Rs 6.50, 22:00-06:00) Match: {off_peak_rate_match}")
    print(f"    Normal Tariff (Rs 8.00, 06:00-18:00) Match: {normal_rate_match}")
    print(f"    Peak Tariff (Rs 10.50, 18:00-22:00) Match: {peak_rate_match}")
    
    # 5. ML Data Leakage Risk Analysis
    print(f"\n[6] MACHINE LEARNING DATA LEAKAGE AUDIT")
    # Leakage Risk 1: Target variable correlation with features
    correlations = df[['total_kw', 'hvac_kw', 'comp_kw', 'base_kw', 'temp_celsius', 'solar_ghi', 'is_spike_event']].corr()['total_kw']
    print("    Correlations with total_kw:")
    print(correlations)
    
    # Leakage Risk 2: Weather Forecast vs Actual separation check
    print("\n    Leakage Assessment Notes:")
    print("    • target_kw (total_kw) is the sum of sub-zones. In training XGBoost, model MUST NOT use sub-zone features (hvac_kw, comp_kw) as input features, because sub-zones are not known ahead of time without sub-meters!")
    print("    • is_spike_event is a synthetic label indicator (0 or 1). Model MUST NOT use is_spike_event as a feature when predicting future kW.")
    print("    • Weather features (temp_celsius, solar_ghi) in this table represent actuals. In real-time 24h forecasting, Open-Meteo FORECAST weather (t+h) must be used as exogenous inputs to prevent actual future weather leakage.")

    print("\n=================================================================")
    print("                     AUDIT COMPLETE                             ")
    print("=================================================================")

if __name__ == "__main__":
    audit_dataset()
