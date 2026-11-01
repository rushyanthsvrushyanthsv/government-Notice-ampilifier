from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.ai_service import ai_service
from app.api.v1.notices import get_current_user
from app.models.all_models import User

router = APIRouter()

class TranslationRequest(BaseModel):
    text: str
    target_language: str = "kn"

@router.post("/text")
async def translate_text(
    req: TranslationRequest,
    current_user: User = Depends(get_current_user)
):
    translated = await ai_service.translate_to_kannada(req.text)
    return {"translated_text": translated}

@router.get("/word-meaning")
async def get_meaning(
    word: str,
    context: str,
    current_user: User = Depends(get_current_user)
):
    meaning = await ai_service.get_word_meaning(word, context)
    return {"word": word, "meaning": meaning}
