# Premium Home Guide + Theme + Watch Fix

This patch fixes and polishes the SFDC Mentor / Career OS frontend.

## What it fixes

- Removes this Home Guide text/path: `Use Home Guide -> Question Bank -> AI Mentor -> Career Prep.`
- Fixes theme buttons: 🔵 🌙 🟣
- Adds proper Night Mode
- Adds floating ⌚ Career Watch with live clock and 25m/45m focus sprint timer
- Adds premium glassmorphism polish CSS
- Creates a backup before modifying frontend files

## How to run

From the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\patches\apply-premium-home-theme-watch-fix.ps1
```

Then start the frontend:

```powershell
cd frontend
npm run dev
```

If your repo only has a frontend folder opened directly, run the script from inside that frontend folder or keep the `patches` folder at project root.

## Safety

The script creates a folder like:

```text
frontend/premium-fix-backup-YYYYMMDD-HHMMSS
```

It stores backup copies of `index.html`, `styles.css`, and relevant source files before applying changes.
