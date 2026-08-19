import datetime

def get_mock_forecast() -> list:
    """
    Returns a realistic 24-hour hourly kW forecast.
    Simulates a typical commercial building load profile starting at 00:00:00.
    Injects a massive spike at 06:00:00 IST (777.71 kW) representing simultaneous
    startup of HVAC Chiller #2 and Compressor #1 to match the seed dataset.
    """
    forecast = []
    base_date = datetime.date(2017, 1, 2)  # Jan 2, 2017, matches verification checks
    
    for hour in range(24):
        timestamp = f"{base_date.isoformat()}T{hour:02d}:00:00+05:30"
        
        # Base load profile: lower at night, ramping up in morning/afternoon
        if hour < 5 or hour >= 22:
            predicted_kw = 120.0 + (hour % 3) * 5.0  # night baseline (~120-130 kW)
        elif hour == 6:
            predicted_kw = 777.71  # injected demand spike matching rec_042 baseline peak load
        elif 8 <= hour <= 17:
            predicted_kw = 350.0 + (hour % 5) * 15.0  # daytime business hours (~350-425 kW)
        else:
            predicted_kw = 200.0 + (hour % 4) * 10.0  # transition periods
            
        forecast.append({
            "timestamp": timestamp,
            "predicted_kw": round(predicted_kw, 2)
        })
        
    return forecast
