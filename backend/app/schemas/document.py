from pydantic import BaseModel, Field

from app.schemas.common import UtcDatetime


class DocumentResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    description: str | None
    chunk_count: int
    created_at: UtcDatetime

    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    chunk_count: int
    message: str
