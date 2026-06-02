from fastapi import APIRouter

from app.schemas import EnhancePromptRequest, EnhancePromptResponse
from app.services import prompt_service

router = APIRouter(prefix="/api", tags=["prompt"])


@router.post("/enhance-prompt", response_model=EnhancePromptResponse)
async def enhance_prompt(request: EnhancePromptRequest) -> EnhancePromptResponse:
    enhanced = await prompt_service.enhance_prompt(request.prompt)
    return EnhancePromptResponse(original=request.prompt, enhanced=enhanced)
