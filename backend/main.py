from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import requests
import json
import os
import sys
from pathlib import Path

# Add the parent directory to sys.path to import services
sys.path.append(str(Path(__file__).parent.parent))

from services.chat_service import MedicalChatService
from services.safety_guard import SafetyGuard
from services.document_service import DocumentProcessor
from services.vision_service import VisionAnalyzer
from services.ollama_manager import ollama_manager
from config import config

app = FastAPI(title="Med.io API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
chat_service = MedicalChatService()
safety_guard = SafetyGuard()
document_processor = DocumentProcessor()
vision_analyzer = VisionAnalyzer()

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    provider: Optional[str] = "ollama"
    api_key: Optional[str] = ""
    model: Optional[str] = None

class ModelSwitchRequest(BaseModel):
    model: str

@app.get("/status")
def get_status():
    """Check if Ollama is running and return system status."""
    try:
        response = requests.get(f"{config.OLLAMA_BASE_URL}/api/tags", timeout=5)
        online = response.status_code == 200
        models_data = response.json() if online else {"models": []}
        return {
            "online": online,
            "models": models_data.get("models", []),
            "active_model": chat_service.model
        }
    except Exception:
        return {
            "online": False,
            "models": [],
            "active_model": chat_service.model
        }

@app.get("/models")
def get_models():
    """Get list of available models from Ollama."""
    try:
        response = requests.get(f"{config.OLLAMA_BASE_URL}/api/tags", timeout=5)
        if response.status_code == 200:
            return response.json()
        return {"models": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: ChatRequest):
    """Handle medical chat requests."""
    try:
        print(f"📨 /chat received: provider={request.provider}, model={request.model}, api_key={'***set***' if request.api_key else '(empty)'}")
        
        # Test connection first (only for Ollama)
        if request.provider == "ollama":
            connected, _ = chat_service.test_connection()
            if not connected:
                raise HTTPException(status_code=503, detail="AI service unavailable")

        # Validate external API configuration
        if request.provider != "ollama":
            if not request.api_key or request.api_key.strip() == "":
                return {"success": False, "response": f"❌ API key is required for {request.provider}. Please add your API key in Settings.", "error_type": "missing_api_key"}
            if not request.model or request.model.strip() == "":
                return {"success": False, "response": f"❌ Model name is required for {request.provider}. Please enter a model name in Settings.", "error_type": "missing_model"}

        response_data = chat_service.get_medical_response(
            request.message, 
            request.history,
            provider=request.provider,
            api_key=request.api_key,
            model=request.model
        )
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"success": False, "response": f"❌ Error: {str(e)}", "error_type": "server_error"}

@app.post("/analyze_document")
async def analyze_document(
    file: UploadFile = File(...),
    provider: str = Form("ollama"),
    api_key: str = Form(""),
    model: str = Form("")
):
    """Handle document uploads and medical analysis."""
    try:
        file_bytes = await file.read()
        file_type = file.content_type
        filename = file.filename

        # Process document
        processing_result = document_processor.process_document(file_bytes, file_type, filename)
        
        if not processing_result["success"]:
            return processing_result

        # AI Analysis — use external API if configured
        if provider != "ollama" and api_key and model:
            analysis_result = document_processor.analyze_medical_document(
                processing_result["extracted_text"],
                provider=provider, api_key=api_key, model_name=model
            )
        else:
            analysis_result = document_processor.analyze_medical_document(processing_result["extracted_text"])
        
        return {
            "processing": processing_result,
            "analysis": analysis_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze_image")
async def analyze_image(file: UploadFile = File(...)):
    """Handle image uploads and vision analysis."""
    try:
        file_bytes = await file.read()
        filename = file.filename

        # Process image with vision service
        analysis_result = vision_analyzer.analyze_medical_image(file_bytes)
        return analysis_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/switch_model")
def switch_model(request: ModelSwitchRequest):
    """Switch the active LLM model."""
    try:
        chat_service.model = request.model
        document_processor.model = request.model
        return {"success": True, "active_model": chat_service.model}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
