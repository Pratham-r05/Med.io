# Med.io Medical AI App Conversion Guide

This document provides step-by-step instructions to convert the existing Streamlit-based medical AI app (Med.io) into a React + FastAPI web application. All existing Python service files are already present and should not be modified.

---

## CONTEXT

The app consists of 3 pages:
- **Medical Chat**: Chat with Ollama AI
- **Report Analysis**: Upload PDF/image, extract text, perform AI analysis
- **Image Analysis**: Upload or capture images for AI vision analysis

Existing services (do not modify):
| Service File | Class/Function |
| --- | --- |
| `services/chat_service.py` | `MedicalChatService` |
| `services/document_service.py` | `DocumentProcessor` |
| `services/vision_service.py` | `VisionAnalyzer` |
| `services/safety_guard.py` | `SafetyGuard` |
| `services/ollama_manager.py` | `ollama_manager` |
| `config.py` | Configuration |

---

## STEP 1 — Create FastAPI backend
Create a file `backend/main.py` with the following content:
- Import and initialize services: MedicalChatService, DocumentProcessor, VisionAnalyzer, SafetyGuard, ollama_manager from services.
- Add CORS middleware allowing all origins.
- Define these endpoints:

### GET `/status`
- Check if Ollama is running by calling: 
```python
requests.get("http://localhost:11434/api/tags", timeout=5)
```
- Return JSON:
```json
{ "online": true/false, "models": [...], "active_model": chat_service.model }
def status(): ...
def get_models(): ...
def chat(): ...
def analyze_document(): ...
def analyze_image(): ...
def switch_model(): ...
document to full code implementation as per instructions.
```
### Run command:
uicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

---

## STEP 2 — Scaffold React frontend
In folder `frontend/`, execute:
npm create vite@latest . -- --template react 
and install dependencies:
npm install react-router-dom axios tailwindcss @tailwindcss/vite.
Configure Tailwind in `vite.config.js`, add directives to `index.css`. 
Set up React Router in `main.jsx`: routes for `/`, `/chat`, `/documents`, `/images`. 
Create a Layout component with persistent Sidebar.
Create `.env` with:
vite_api_url=http://localhost:8000.

---

## STEP 3 — Build Sidebar component (`frontend/src/components/Sidebar.jsx`) 
to include app title, navigation links, status indicator (polls /status), settings section (model picker, temperature slider, clear chat), privacy notice, medical guidelines section.
Use Tailwind classes for styling.
Implement polling every 5 seconds to update system status and model info.
Highlight active route using NavLink.
Implement collapsible sections for settings and guidelines.
Include a footer with privacy notice "100% local processing".
Add background medical icons with CSS animation at low opacity.
Ensure responsiveness and accessibility where applicable.ff