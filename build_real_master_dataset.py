import os
import urllib.request
import json
import pandas as pd
import numpy as np

def build_dataset():
    print("=== Step 1: Ingesting Real Kaggle Dataset (PJME_hourly.csv) ===")
    kaggle_path = "Energy Consumption/PJME_hourly.csv"
    df_kaggle = pd.read_csv(kaggle_path)
    df_kaggle['Datetime'] = pd.to_datetime(df_kaggle['Datetime'])
    df_kaggle = df_kaggle.sort_values('Datetime').drop_duplicates('Datetime').reset_index(drop=True)
    
    # Filter for 1 full year of clean historical data (2017)
    start_date = "2017-01-01 00:00:00"
    end_date = "2017-12-31 23:00:00"
    mask = (df_kaggle['Datetime'] >= start_date) & (df_kaggle['Datetime'] <= end_date)
    df_year = df_kaggle.loc[mask].copy().reset_index(drop=True)
    print(f"Filtered 2017 Kaggle data: {len(df_year)} hourly records.")

    print("\n=== Step 2: Resampling & Disaggregating to 15-Minute Sub-Hourly Intervals ===")
    # Create 15-minute datetime grid
    dt_15m = pd.date_range(start="2017-01-01 00:00:00", end="2017-12-31 23:45:00", freq="15min")
    df_15m = pd.DataFrame({'Datetime': dt_15m})
    
    # Merge hourly MW and perform cubic spline interpolation
    df_merged = pd.merge(df_15m, df_year, on='Datetime', how='left')
    df_merged['PJME_MW'] = df_merged['PJME_MW'].interpolate(method='cubic').ffill().bfill()
    
    # Scale MW down to commercial campus scale (Base ~200 kW, Peak ~1,500 kW)
    mw_min, mw_max = df_merged['PJME_MW'].min(), df_merged['PJME_MW'].max()
    target_min, target_max = 200.0, 1500.0
    df_merged['total_kw'] = target_min + (df_merged['PJME_MW'] - mw_min) * (target_max - target_min) / (mw_max - mw_min)
    df_merged['total_kw'] = df_merged['total_kw'].round(2)
    
    # Base background loads from spline disaggregation
    df_merged['base_kw'] = (df_merged['total_kw'] * 0.20).round(2)
    df_merged['hvac_kw'] = (df_merged['total_kw'] * 0.45).round(2)
    df_merged['comp_kw'] = (df_merged['total_kw'] * 0.35).round(2)

    print("\n=== Step 2B: Injecting Equipment State-Machine Spikes & Inrush Events ===")
    # Cubic splines smooth out 15-min spikes. We inject realistic discrete equipment state-machine events:
    # 1. Weekday morning simultaneous equipment startup (06:00 AM - 06:15 AM): HVAC Chiller #2 ramp + Compressor #1 restart
    # 2. Afternoon heavy cooling / defrost cycle surges (14:00 PM - 14:15 PM)
    hours = df_merged['Datetime'].dt.hour
    minutes = df_merged['Datetime'].dt.minute
    dayofweek = df_merged['Datetime'].dt.dayofweek # 0-4 are weekdays
    
    is_weekday = dayofweek < 5
    is_morning_startup = is_weekday & (hours == 6) & (minutes == 0)
    is_afternoon_surge = is_weekday & (hours == 14) & (minutes == 0)

    # Spike injection values
    # Morning startup spike: +180 kW on HVAC, +140 kW on Compressors (creates ~680 kW total peak spike!)
    df_merged.loc[is_morning_startup, 'hvac_kw'] += 180.0
    df_merged.loc[is_morning_startup, 'comp_kw'] += 140.0
    df_merged.loc[is_morning_startup, 'is_spike_event'] = 1

    # Afternoon surge spike: +120 kW on HVAC, +90 kW on Compressors
    df_merged.loc[is_afternoon_surge, 'hvac_kw'] += 120.0
    df_merged.loc[is_afternoon_surge, 'comp_kw'] += 90.0
    df_merged.loc[is_afternoon_surge, 'is_spike_event'] = 1
    
    df_merged['is_spike_event'] = df_merged['is_spike_event'].fillna(0).astype(int)

    # Recalculate total_kw from updated sub-zones to maintain exact mathematical integrity
    df_merged['total_kw'] = (df_merged['hvac_kw'] + df_merged['comp_kw'] + df_merged['base_kw']).round(2)
    print(f"Injected equipment startup spikes across {df_merged['is_spike_event'].sum()} 15-minute intervals.")

    print("\n=== Step 3: Fetching Real Historical Weather & Solar GHI Data (Open-Meteo Archive API) ===")
    # Fetching real historical weather for PJM region (Lat: 40.0, Lon: -75.5) for 2017
    api_url = "https://archive-api.open-meteo.com/v1/archive?latitude=40.0&longitude=-75.5&start_date=2017-01-01&end_date=2017-12-31&hourly=temperature_2m,relative_humidity_2m,shortwave_radiation"
    print(f"Requesting API: {api_url}")
    req = urllib.request.urlopen(api_url)
    weather_data = json.loads(req.read().decode('utf-8'))
    
    hourly_w = pd.DataFrame({
        'Datetime': pd.to_datetime(weather_data['hourly']['time']),
        'temp_celsius': weather_data['hourly']['temperature_2m'],
        'humidity_pct': weather_data['hourly']['relative_humidity_2m'],
        'solar_ghi': weather_data['hourly']['shortwave_radiation']
    })
    
    # Merge hourly weather onto 15-minute grid and forward fill / spline interpolate
    df_merged = pd.merge(df_merged, hourly_w, on='Datetime', how='left')
    df_merged['temp_celsius'] = df_merged['temp_celsius'].interpolate(method='linear').round(1)
    df_merged['humidity_pct'] = df_merged['humidity_pct'].interpolate(method='linear').round(1)
    df_merged['solar_ghi'] = df_merged['solar_ghi'].interpolate(method='linear').round(1)

    print("\n=== Step 4: Encoding Indian DISCOM Commercial Tariff Rules ===")
    # TOD Rules: Off-Peak (22:00-06:00): Rs 6.50, Normal (06:00-18:00): Rs 8.00, Peak (18:00-22:00): Rs 10.50
    h_series = df_merged['Datetime'].dt.hour
    
    conditions = [
        (h_series >= 22) | (h_series < 6),
        (h_series >= 6) & (h_series < 18),
        (h_series >= 18) & (h_series < 22)
    ]
    rates = [6.50, 8.00, 10.50]
    df_merged['tod_rate_inr'] = np.select(conditions, rates, default=8.00)
    df_merged['is_peak_hour_flag'] = np.where((h_series >= 18) & (h_series < 22), 1, 0)
    df_merged['demand_charge_rate_inr'] = 500.0  # Rs. 500 / kW / month

    print("\n=== Step 5: Performing Rigorous Data Quality & Validation Checks ===")
    assert df_merged['total_kw'].isnull().sum() == 0, "Error: Missing values found in total_kw!"
    assert df_merged['temp_celsius'].isnull().sum() == 0, "Error: Missing values in temp_celsius!"
    assert df_merged['solar_ghi'].isnull().sum() == 0, "Error: Missing values in solar_ghi!"
    assert (df_merged['total_kw'] > 0).all(), "Error: Non-positive total_kw detected!"
    
    # Check equipment sub-zone sum integrity
    subzone_sum = (df_merged['hvac_kw'] + df_merged['comp_kw'] + df_merged['base_kw']).round(2)
    diff = (df_merged['total_kw'] - subzone_sum).abs()
    assert (diff < 0.05).all(), "Error: Sub-zone sum mismatch!"
    
    print(f"Data Validation PASSED cleanly across {len(df_merged)} rows!")

    print("\n=== Step 6: Saving Master Dataset Artifacts ===")
    csv_output = "historical_training_campus_data.csv"
    df_merged.to_csv(csv_output, index=False)
    print(f"Saved Master CSV: {csv_output} ({os.path.getsize(csv_output)} bytes)")
    
    # Also save seed JSON fixture for Track 6 / contracts
    seed_dir = "packages/contracts/seed"
    os.makedirs(seed_dir, exist_ok=True)
    seed_path = os.path.join(seed_dir, "seed_facility_data.json")
    
    # Save first 1,000 rows sample for lightweight seed fixture
    df_merged.head(1000).to_json(seed_path, orient='records', date_format='iso')
    print(f"Saved Seed Dataset JSON: {seed_path} ({os.path.getsize(seed_path)} bytes)")

    print("\nDataset Summary Preview:")
    print(df_merged.head(5))

if __name__ == "__main__":
    build_dataset()
