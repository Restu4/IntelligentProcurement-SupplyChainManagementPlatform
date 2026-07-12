from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)


class SourceEvidence(BaseModel):
    document: str
    chunk: str
    score: float


class ChatResponse(BaseModel):
    question: str
    answer: str
    sources: list[SourceEvidence]
    confidence: float


class HistoryResponse(BaseModel):
    id: int
    question: str
    answer: str
    confidence: float | None
    sources_json: str | None
    created_at: str

    class Config:
        from_attributes = True
