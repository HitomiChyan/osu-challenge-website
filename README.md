# osu-challenge-website

This repository contains the static files for the osu! challenge website.

## Updating registration data

The `scripts/update_registrations.py` script pulls the latest entries from the
Google Form's linked Google Sheet and writes them to `data/registrations.json`.
This keeps the website data in sync with form responses.

### Prerequisites

- Python 3.7 or later
- Python packages listed in `requirements.txt` (includes [`gspread`](https://pypi.org/project/gspread/))
- A Google service account JSON credentials file
- Access to the Google Sheet containing the form responses

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

### Running the update script

Set the following environment variables:

- `SHEET_ID` – ID of the Google Sheet
- `GOOGLE_APPLICATION_CREDENTIALS` – path to the service account credentials
  (defaults to `service_account.json` in the repository root)
- `WORKSHEET` – optional worksheet name (defaults to `Sheet1`)

Then run the script from the repository root so the path resolves correctly:

```bash
python scripts/update_registrations.py
```

On Windows using PowerShell the equivalent commands are:

```powershell
$env:SHEET_ID = 'your-sheet-id'
$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\path\service_account.json'
python scripts/update_registrations.py
```

The script will fetch all rows from the sheet, map the columns to the expected
fields (`twitchName`, `twitchID`, `activityName`, `rank`, `time`, `identity`,
`results`), and write the output to `data/registrations.json` using UTF-8
encoding.
