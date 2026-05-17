# SFDC Mentor Complete All Features

A structured frontend/backend app for Salesforce career preparation.

## Frontend
```powershell
cd frontend
npm install --registry=https://registry.npmjs.org/
npm run dev
```
Open: http://localhost:5173

## Backend
```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Open: http://127.0.0.1:8000/docs

## Optional Ollama
```powershell
ollama pull llama3.2
ollama serve
```
