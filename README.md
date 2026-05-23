# SFDC Mentor Career OS

A professional, user-friendly Salesforce career preparation app for learning, interview practice, project proof, resume improvement and job tracking.

The app is designed for a learner who wants one clean workflow instead of many confusing pages:

```text
Home Guide -> Question Bank -> AI Mentor -> Focus Practice -> Career Prep -> Job Tracker
```

## What this app does

- Gives a private dashboard for Salesforce career preparation.
- Tracks real progress through saved answers, strong/weak markings, weekly tests, job applications and daily work.
- Provides topic-wise question practice for Salesforce, DSA, System Design and interview preparation.
- Includes AI Mentor support with backend, search links and optional Ollama fallback.
- Helps create project proof, resume readiness and job application notes.
- Keeps automation silent in the background so the UI stays simple.

## Main user flow

| Step | Page | Purpose |
|---|---|---|
| 1 | Home Guide | See job-ready score, today focus and next action |
| 2 | Question Bank | Practice and save answers |
| 3 | AI Mentor | Ask doubts and improve explanations |
| 4 | Focus Practice | Mark answers Weak or Strong |
| 5 | Interview Room | Prepare realistic interview answers |
| 6 | Job Tracker | Track applications, notes and follow-ups |
| 7 | Backup | Export local data safely |

## Frontend setup

```powershell
cd frontend
npm install --registry=https://registry.npmjs.org/
npm run dev
```

Open:

```text
http://localhost:5173
```

## Backend setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open:

```text
http://127.0.0.1:8000/docs
http://127.0.0.1:8000/api/health
```

## Optional Ollama setup

```powershell
ollama pull llama3.2
ollama serve
```

The app works without Ollama. If Ollama is installed, AI Mentor can use it as a local model option.

## Project structure

```text
frontend/src/
  App.jsx                 App routes and protected pages
  components/UI.jsx       Layout, sidebar, topbar and reusable UI components
  pages/Dashboard.jsx     Home Guide and Job Ready Score dashboard
  pages/Mentor.jsx        AI Mentor, Focus Mode, Learning Coach and Daily Route
  pages/Practice.jsx      Question Bank, Scenario Practice and Use Cases
  pages/TestsInterview.jsx Interview Room, Projects and Weekly Tests
  pages/JobsTools.jsx     Job Tracker, JD Matcher and More Tools
  pages/Productivity.jsx  Notes, Documents, Doubts, Journal, Backup, Time Tracker
  data/                   Questions, companies, profile and roadmap data
  utils/                  Local storage, scoring and helper utilities

backend/app/
  main.py                 FastAPI app, mentor endpoint, persistence and search APIs
```

## Professional design principles used

- Keep the visible flow simple.
- Hide confusing automation pages and run automation silently.
- Score only from real saved work.
- Use clear labels, readable spacing and professional visual hierarchy.
- Keep all important actions close to the learner's daily workflow.

## Job Ready Score logic

The score improves when the learner creates real proof:

- Saved answers
- Strong topic markings
- Completed time-tracker tasks
- Weekly test records
- Job applications and follow-ups
- Mentor or interview answer work

This keeps the dashboard honest and professional.

## Notes

- Most user data is stored locally through browser localStorage.
- Backend persistence endpoints are available for sync/search use.
- Always use Backup Center before clearing browser data.
