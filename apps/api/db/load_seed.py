"""
DuckDB Loader Script
Reads packages/contracts/seed/seed_facility_data.json and populates
apps/api/db/energy.duckdb with a table named `readings`.
"""

import json
import sys
from pathlib import Path

import duckdb

# Determine repository root
REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

DB_DIR = Path(__file__).resolve().parent
DB_FILE = DB_DIR / "energy.duckdb"
SEED_JSON = REPO_ROOT / "packages" / "contracts" / "seed" / "seed_facility_data.json"


def load_seed_data():
    if not SEED_JSON.exists():
        raise FileNotFoundError(f"Seed dataset not found at: {SEED_JSON}")

    # Remove existing duckdb file if present to rebuild cleanly
    if DB_FILE.exists():
        DB_FILE.unlink()

    print(f"Loading seed data from {SEED_JSON} into DuckDB at {DB_FILE}...")
    conn = duckdb.connect(str(DB_FILE))

    # Read JSON file using DuckDB's read_json_auto function and add default facility_id and zone_id
    json_path_str = str(SEED_JSON).replace("\\", "/")
    query = f"""
    CREATE TABLE readings AS
    SELECT
        'f_001' AS facility_id,
        'z_hvac_3' AS zone_id,
        CAST(Datetime AS TIMESTAMP) AS Datetime,
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
    FROM read_json_auto('{json_path_str}')
    ORDER BY Datetime ASC;
    """
    conn.execute(query)

    count = conn.execute("SELECT COUNT(*) FROM readings;").fetchone()[0]
    peak = conn.execute("SELECT MAX(total_kw) FROM readings;").fetchone()[0]
    print(f"Successfully loaded {count} rows into table 'readings'. Peak total_kw = {peak} kW.")
    
    # Load the random dataset
    RANDOM_CSV = DB_DIR / "refs" / "random_dataset.csv"
    if RANDOM_CSV.exists():
        csv_path_str = str(RANDOM_CSV).replace("\\", "/")
        print(f"Loading random data from {RANDOM_CSV}...")
        conn.execute(f"CREATE TABLE random_data AS SELECT * FROM read_csv_auto('{csv_path_str}');")
        rand_count = conn.execute("SELECT COUNT(*) FROM random_data;").fetchone()[0]
        print(f"Successfully loaded {rand_count} rows into table 'random_data'.")
    else:
        print(f"Warning: Random dataset not found at {RANDOM_CSV}")
        
    conn.close()


if __name__ == "__main__":
    load_seed_data()
