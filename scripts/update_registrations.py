import os
import json
from typing import List

try:
    import gspread  # type: ignore
except ImportError as e:
    raise SystemExit("gspread must be installed: pip install gspread") from e


COLUMN_MAPPING = {
    "Twitch Name": "twitchName",
    "Twitch ID": "twitchID",
    "Activity Name": "activityName",
    "Rank": "rank",
    "Time": "time",
    "Identity": "identity",
    "Results": "results",
}


def fetch_rows(sheet_id: str, worksheet: str = "Sheet1", creds: str = "service_account.json") -> List[dict]:
    gc = gspread.service_account(filename=creds)
    sh = gc.open_by_key(sheet_id)
    ws = sh.worksheet(worksheet)
    return ws.get_all_records()


def transform_row(row: dict) -> dict:
    result = {}
    for col, field in COLUMN_MAPPING.items():
        value = row.get(col, "")
        if field == "results":
            if isinstance(value, str):
                value = [v.strip() for v in value.split(',') if v.strip()]
        result[field] = value
    return result


def main():
    sheet_id = os.environ.get("SHEET_ID") or "<your-sheet-id>"
    worksheet = os.environ.get("WORKSHEET", "Sheet1")
    creds = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "service_account.json")

    rows = fetch_rows(sheet_id, worksheet, creds)
    transformed = [transform_row(row) for row in rows]

    out_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'registrations.json')
    out_file = os.path.abspath(out_file)
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(transformed, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(transformed)} registrations to {out_file}")


if __name__ == "__main__":
    main()
