def get_mock_tariff() -> dict:
    """
    Returns a mock tariff context containing rate structures and demand charge rules.
    Includes the 'demand_charge_15min_peak' rule with a 500.0 kW threshold.
    """
    return {
        "building_id": "f_001",
        "currency": "INR",
        "rules": [
            {
                "name": "demand_charge_15min_peak",
                "threshold_kw": 500.0,
                "rate_inr_per_kw": 500.0,
                "description": "Fixed charges are determined by the single highest 15-minute average demand peak in the billing cycle."
            }
        ],
        "tod_rates": {
            "peak_rate_inr_per_kwh": 12.0,
            "off_peak_rate_inr_per_kwh": 6.0,
            "normal_rate_inr_per_kwh": 8.0
        }
    }
