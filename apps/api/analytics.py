"""
DuckDB Analytics Engine
Read-only queries against apps/api/db/energy.duckdb
"""

from pathlib import Path
from typing import Optional, List, Dict, Any, Literal
import duckdb

DB_FILE = Path(__file__).resolve().parent / "db" / "energy.duckdb"


def get_db_connection():
    if not DB_FILE.exists():
        from apps.api.db.load_seed import load_seed_data
        load_seed_data()
    return duckdb.connect(str(DB_FILE), read_only=True)


def query_readings(
    facility_id: Optional[str] = None,
    zone_id: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
    agg: Literal["raw", "hourly", "daily"] = "raw",
    limit: int = 500,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        where_clauses = ["1=1"]
        params = []

        if facility_id:
            where_clauses.append("facility_id = ?")
            params.append(facility_id)
        if zone_id:
            where_clauses.append("zone_id = ?")
            params.append(zone_id)
        if start:
            where_clauses.append("Datetime >= ?")
            params.append(start)
        if end:
            where_clauses.append("Datetime <= ?")
            params.append(end)

        where_str = " AND ".join(where_clauses)

        if agg == "hourly":
            sql = f"""
            SELECT
                facility_id,
                zone_id,
                strftime(date_trunc('hour', Datetime), '%Y-%m-%dT%H:%M:%S.000') AS Datetime,
                ROUND(AVG(total_kw), 2) AS total_kw,
                ROUND(MAX(total_kw), 2) AS max_kw,
                ROUND(AVG(base_kw), 2) AS base_kw,
                ROUND(AVG(hvac_kw), 2) AS hvac_kw,
                ROUND(AVG(comp_kw), 2) AS comp_kw,
                MAX(is_spike_event) AS is_spike_event,
                ROUND(AVG(temp_celsius), 2) AS temp_celsius,
                ROUND(AVG(humidity_pct), 2) AS humidity_pct,
                ROUND(AVG(solar_ghi), 2) AS solar_ghi,
                ROUND(AVG(tod_rate_inr), 2) AS tod_rate_inr,
                MAX(is_peak_hour_flag) AS is_peak_hour_flag,
                MAX(demand_charge_rate_inr) AS demand_charge_rate_inr
            FROM readings
            WHERE {where_str}
            GROUP BY facility_id, zone_id, date_trunc('hour', Datetime)
            ORDER BY Datetime ASC
            LIMIT ? OFFSET ?;
            """
        elif agg == "daily":
            sql = f"""
            SELECT
                facility_id,
                zone_id,
                strftime(date_trunc('day', Datetime), '%Y-%m-%d') AS Datetime,
                ROUND(AVG(total_kw), 2) AS total_kw,
                ROUND(MAX(total_kw), 2) AS max_kw,
                ROUND(AVG(base_kw), 2) AS base_kw,
                ROUND(AVG(hvac_kw), 2) AS hvac_kw,
                ROUND(AVG(comp_kw), 2) AS comp_kw,
                MAX(is_spike_event) AS is_spike_event,
                ROUND(AVG(temp_celsius), 2) AS temp_celsius,
                ROUND(AVG(humidity_pct), 2) AS humidity_pct,
                ROUND(AVG(solar_ghi), 2) AS solar_ghi,
                ROUND(AVG(tod_rate_inr), 2) AS tod_rate_inr,
                MAX(is_peak_hour_flag) AS is_peak_hour_flag,
                MAX(demand_charge_rate_inr) AS demand_charge_rate_inr
            FROM readings
            WHERE {where_str}
            GROUP BY facility_id, zone_id, date_trunc('day', Datetime)
            ORDER BY Datetime ASC
            LIMIT ? OFFSET ?;
            """
        else:  # raw
            sql = f"""
            SELECT
                facility_id,
                zone_id,
                strftime(Datetime, '%Y-%m-%dT%H:%M:%S.000') AS Datetime,
                total_kw,
                base_kw,
                hvac_kw,
                comp_kw,
                is_spike_event,
                temp_celsius,
                humidity_pct,
                solar_ghi,
                tod_rate_inr,
                is_peak_hour_flag,
                demand_charge_rate_inr
            FROM readings
            WHERE {where_str}
            ORDER BY Datetime ASC
            LIMIT ? OFFSET ?;
            """

        params.extend([limit, offset])
        rel = conn.execute(sql, params)
        cols = [desc[0] for desc in rel.description]
        rows = rel.fetchall()
        return [dict(zip(cols, row)) for row in rows]
    finally:
        conn.close()


def query_peak_reading(facility_id: Optional[str] = None) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        where_str = "1=1"
        params = []
        if facility_id:
            where_str += " AND facility_id = ?"
            params.append(facility_id)

        sql = f"""
        SELECT
            facility_id,
            zone_id,
            strftime(Datetime, '%Y-%m-%dT%H:%M:%S.000') AS timestamp,
            total_kw AS peak_demand_kw,
            base_kw,
            hvac_kw,
            comp_kw,
            demand_charge_rate_inr,
            ROUND(total_kw * demand_charge_rate_inr, 2) AS estimated_monthly_demand_charge_inr,
            'demand_charge_15min_peak' AS cited_rule
        FROM readings
        WHERE {where_str}
        ORDER BY total_kw DESC
        LIMIT 1;
        """
        rel = conn.execute(sql, params)
        cols = [desc[0] for desc in rel.description]
        row = rel.fetchone()
        if not row:
            return {}
        return dict(zip(cols, row))
    finally:
        conn.close()
