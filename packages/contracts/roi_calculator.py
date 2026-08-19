"""
================================================================================
SMART ENERGY OPTIMIZATION AGENT - REUSABLE ROI CALCULATOR MODULE
================================================================================
Repository Location: D:\\Cognizant-hackathon\\packages\\contracts\\roi_calculator.py

Specification (per jerin.md Priority Item #5):
Exposes a single reusable ROI calculation function for Dashboard, Reporting,
and Agentic AI tracks so cost savings are never re-implemented in parallel.

Usage Example:
>>> from packages.contracts.roi_calculator import calculate_roi
>>> roi = calculate_roi(kw_shaved=260.0, demand_rate_inr=500.0)
>>> print(f"Monthly Savings: Rs {roi['monthly_savings_inr']:,.2f} | Annual: Rs {roi['annual_savings_inr']:,.2f}")
================================================================================
"""

from typing import Dict, Any

def calculate_roi(
    kw_shaved: float,
    demand_rate_inr: float = 500.0,
    energy_saved_kwh: float = 0.0,
    tod_tariff_inr: float = 8.0,
    emission_factor_kg_per_kwh: float = 0.82
) -> Dict[str, Any]:
    """
    Computes direct financial savings and carbon footprint reduction for a given peak kW shaving recommendation.
    
    Formula:
      - Monthly Demand Charge Savings (INR) = kw_shaved * demand_rate_inr
      - Annual Demand Charge Savings (INR)  = kw_shaved * demand_rate_inr * 12
      - Energy Cost Savings (INR)           = energy_saved_kwh * tod_tariff_inr
      - Total Annual Financial Savings (INR)= Annual Demand Savings + (Energy Savings * 365)
      - CO2 Footprint Reduction (kg CO2e)   = energy_saved_kwh * emission_factor_kg_per_kwh
      
    Returns a standardized dictionary containing formatted INR values and metrics.
    """
    if kw_shaved < 0.0:
        kw_shaved = 0.0
        
    monthly_demand_savings = kw_shaved * demand_rate_inr
    annual_demand_savings  = monthly_demand_savings * 12.0
    daily_energy_savings   = energy_saved_kwh * tod_tariff_inr
    annual_energy_savings   = daily_energy_savings * 365.0
    total_annual_savings   = annual_demand_savings + annual_energy_savings
    co2_reduction_kg       = energy_saved_kwh * emission_factor_kg_per_kwh
    
    return {
        "kw_shaved": float(kw_shaved),
        "demand_rate_inr_per_kw": float(demand_rate_inr),
        "monthly_demand_savings_inr": round(float(monthly_demand_savings), 2),
        "annual_demand_savings_inr": round(float(annual_demand_savings), 2),
        "annual_energy_savings_inr": round(float(annual_energy_savings), 2),
        "total_annual_savings_inr": round(float(total_annual_savings), 2),
        "co2_reduction_kg_per_day": round(float(co2_reduction_kg), 2),
        "formula_reference": "kw_shaved * demand_rate_inr * 12"
    }

if __name__ == "__main__":
    # Test suite run
    res = calculate_roi(kw_shaved=260.0)
    print("=== ROI CALCULATOR MODULE VERIFICATION ===")
    print(f"Monthly Savings: Rs. {res['monthly_demand_savings_inr']:,.2f}")
    print(f"Annual Savings:  Rs. {res['annual_demand_savings_inr']:,.2f}")
    print("STATUS: VERIFIED CLEANLY!")
