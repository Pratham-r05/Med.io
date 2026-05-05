You are converting a Streamlit medical AI app (Med.io) to a React + FastAPI web app. All existing Python service files are already present. Do not modify any existing service files. Follow these steps exactly in order.

## CONTEXT

The app has 3 pages:
- Medical Chat (chat with Ollama AI)
- Report Analysis (upload PDF/image, extract text, AI analysis)
- Image Analysis (upload or camera capture, AI vision analysis)

Existing services (do not touch):
- services/chat_service.py → MedicalChatService
- services/document_service.py → DocumentProcessor
- services/vision_service.py → VisionAnalyzer
- services/safety_guard.py → SafetyGuard
- services/ollama_manager.py → ollama_manager
- config.py → config

---

## STEP 1 — Create FastAPI backend

Create a file `backend/main.py` with the following:

- Import and initialize: MedicalChatService, DocumentProcessor, VisionAnalyzer, SafetyGuard, ollama_manager from services
- Add CORS middleware allowing all origins
- Create these endpoints:

GET /status
- Check if Ollama is running by calling requests.get("http://localhost:11434/api/tags", timeout=5)
- Return { "online": true/false, "models": [...list of model names...], "active_model": chat_service.model }

GET /models
- Fetch http://localhost:11434/api/tags
- Return full models list with name and size fields

POST /chat
- Accept JSON body: { "message": string, "history": [...], "model": string (optional), "temperature": float (optional) }
- If model is provided, set chat_service.model = model
- Call chat_service.get_medical_response(message, history)
- Return { "success": bool, "response": string, "error": string }

POST /analyze-document
- Accept multipart form: file (UploadFile)
- Read file bytes and type
- Call document_processor.process_document(bytes, content_type, filename)
- If success, call document_processor.analyze_medical_document(extracted_text)
- Return { "success": bool, "extracted_text": string, "analysis": string, "error": string }

POST /analyze-image
- Accept multipart form: file (UploadFile), query (optional string)
- Read file bytes
- Call vision_analyzer.analyze_medical_image(bytes, query or None)
- Check emergency indicators via vision_analyzer.detect_emergency_indicators(raw_response)
- Return { "success": bool, "analysis": string, "emergency_indicators": [...], "error": string }

POST /models/switch
- Accept JSON body: { "model": string }
- Set chat_service.model = model
- Return { "success": true, "active_model": model }

- Run with: uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

---

## STEP 2 — Scaffold React frontend

In the folder `frontend/`:

- Initialize with: npm create vite@latest . -- --template react
- Install dependencies: npm install react-router-dom axios tailwindcss @tailwindcss/vite

Configure Tailwind in vite.config.js and add @tailwind directives to index.css.

Set up React Router in main.jsx with these routes:
- / → redirects to /chat
- /chat → ChatPage
- /documents → DocumentsPage
- /images → ImagesPage

Create a Layout component that wraps all pages with a persistent Sidebar on the left.

Create a .env file with: VITE_API_URL=http://localhost:8000

---

## STEP 3 — Build Sidebar component

File: frontend/src/components/Sidebar.jsx

- App title: 🏥 MediLens Local
- Navigation links to /chat, /documents, /images using NavLink (highlight active route)
- Status indicator: poll GET /status every 5 seconds
  - Show green "System Online" if online, red "System Offline" if not
  - Show active model name
  - Show model count
- Settings section (collapsible):
  - Model picker: fetch GET /models, show radio buttons, search/filter input
  - Apply model button: POST /models/switch when different model selected
  - Temperature slider 0.0 to 1.0
  - Clear chat button (emits a custom event or uses context)
- Privacy notice at bottom: "100% local processing"
- Medical guidelines section (collapsible)

---

## STEP 4 — Build Chat page

File: frontend/src/pages/ChatPage.jsx

- If no messages, show welcome screen: "How are you feeling today?" centered
- Scrollable message list:
  - User messages aligned right, blue bubble
  - Assistant messages aligned left, dark bubble
  - Support markdown rendering in assistant messages (use react-markdown)
- Sticky input bar at bottom:
  - Textarea input, send on Enter (Shift+Enter for newline)
  - Send button
  - Loading spinner while waiting for response
- On send:
  - Add user message to local state immediately
  - POST /chat with { message, history, temperature }
  - Append assistant response to state
  - Auto-scroll to bottom after each new message
- Store chat history in local component state (array of {role, content})

---

## STEP 5 — Build Documents page

File: frontend/src/pages/DocumentsPage.jsx

- Title: 📄 Medical Report Analysis
- Info banner explaining the feature
- File upload input (PDF, JPG, JPEG, PNG)
- On file select:
  - Show spinner "Processing document..."
  - POST /analyze-document with FormData
  - Show extracted text in a readonly textarea (collapsible)
  - Show AI analysis as rendered markdown below
  - Show error message if failed
- Drag and drop support on the upload area

---

## STEP 6 — Build Images page

File: frontend/src/pages/ImagesPage.jsx

- Title: 🖼️ Medical Image Analysis
- Two input options side by side:
  - File upload (JPG, JPEG, PNG)
  - Camera capture using getUserMedia (show live preview, capture button)
- Show selected/captured image preview
- Optional text input: "Specific question about the image"
- Analyze button
- On analyze:
  - POST /analyze-image with FormData (file + optional query)
  - Show analysis as rendered markdown
  - If emergency_indicators is non-empty, show red alert box with the indicators and "Seek immediate medical attention"

---


## step 7
Apply a dark, minimal, and modern medical theme across the entire UI using Tailwind CSS. Use bg-slate-900 for the main background, bg-slate-800 for the sidebar, and text-slate-100 for primary text. Keep the design clean, elegant, and low-clutter with soft rounded corners, balanced spacing, and a professional healthcare aesthetic.

Style components as follows:
- User message bubble: bg-blue-600 text-white rounded-2xl px-4 py-2
- Assistant message bubble: bg-slate-700 text-slate-100 rounded-2xl px-4 py-2
- Input field: bg-slate-800 border border-blue-500 rounded-2xl text-slate-100 placeholder:text-slate-400
- Primary buttons: bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold
- Sidebar buttons: bg-slate-600 hover:bg-slate-500 text-slate-100 rounded-lg
- Online status: text-green-400
- Offline status: text-red-400
- Emergency alert: bg-red-900 border border-red-500 text-red-200 rounded-xl px-4 py-3

Add subtle floating medical icons (🩺 💊 🏥 ❤️ 🔬 🩹) in the background with very low opacity, fixed positioning, and slow CSS animation. Ensure the background decorations remain understated and do not overpower the content. Overall, prioritize dark mode readability, minimal aesthetics, and a polished clinical interface.

## STEP 8 — Final wiring and run

Create a root-level README.md with instructions:

Install missing pip packages if any import fails.
Verify all 5 API endpoints return correct responses.
Verify React routing works for all 3 pages.
Verify file upload works on documents and images pages.
Do not modify any existing service files.