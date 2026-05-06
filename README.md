# medo.io

Privacy-first medical assistant.
Chat, report review, image triage.

## Live site

- Production: [medo.prathamraj.dev](https://medo.prathamraj.dev)
- Vercel alias: [med-io.vercel.app](https://med-io.vercel.app)

## Stack

- Frontend: React + Vite
- Backend: FastAPI
- Local AI: Ollama
- Hosted AI: OpenAI, OpenRouter, Anthropic, Gemini

## What it does

- Medical chat with structured answers
- Report analysis for PDFs and report images
- Image analysis for bruises, wounds, skin photos
- Safety filtering for non-medical and greeting queries

## Hosted behavior

- Hosted chat uses your cloud provider key
- Hosted report PDFs stay local-only
- Hosted report image uploads use cloud vision OCR
- Hosted image analysis uses cloud vision models
- Hosted Ollama is not supported

## Local behavior

- Local chat can use Ollama
- Local report OCR uses Tesseract
- Local image analysis uses Ollama vision

## Project structure

- `frontend/` React app
- `backend/` FastAPI app
- `api/index.py` Vercel Python entry
- `services/` chat, OCR, safety, vision services
- `config.py` prompts and runtime config
- `vercel.json` deploy config

## Run locally

1. Install Python deps
```bash
pip install -r requirements.txt
```

2. Install frontend deps
```bash
cd frontend
npm install
```

3. Start backend
```bash
cd /Users/prathamraj/Documents/Placement-Prep/10.Projects/Med.io
uvicorn backend.main:app --reload --port 8000
```

4. Start frontend
```bash
cd /Users/prathamraj/Documents/Placement-Prep/10.Projects/Med.io/frontend
npm run dev
```

## Deploy

- Root project deploys on Vercel
- Frontend builds from `frontend/`
- Backend runs through `api/index.py`
- Set provider key in app Settings after deploy

## Notes

- `Report Analysis` is for actual reports
- `Image Analysis` is for bruise, wound, rash, skin photos
- Non-report photos are rejected from report OCR flow

## Safety

- Informational tool only
- Not a diagnosis
- Emergency symptoms need urgent medical care
