from pydantic import BaseModel, Field


class AITextRequest(BaseModel):
    text: str = Field(min_length=1)


class AIRephraseResponse(BaseModel):
    original: str
    rephrased: str


class AIEnhanceResponse(BaseModel):
    original: str
    enhanced: str


class AISimplifyResponse(BaseModel):
    original: str
    simplified: str


class AIGenerateQuestionsRequest(BaseModel):
    text: str = Field(min_length=1)
    count: int = Field(default=5, ge=1, le=20)


class AIGenerateQuestionsResponse(BaseModel):
    questions: list[str]


class GeneratedFlashcard(BaseModel):
    question: str = Field(min_length=1)
    answer: str = Field(min_length=1)


class AIGenerateFlashcardsRequest(BaseModel):
    text: str = Field(min_length=1)
    count: int = Field(default=5, ge=1, le=20)


class AIGenerateFlashcardsResponse(BaseModel):
    flashcards: list[GeneratedFlashcard]


class AIImageToMarkdownResponse(BaseModel):
    markdown: str
    confidence: float = Field(ge=0.0, le=1.0)
