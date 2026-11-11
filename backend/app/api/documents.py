import asyncio
import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional

from app.config.settings import settings
from app.database.postgres import get_db
from app.database.chromadb import get_collection
from app.models.user import User
from app.models.document import Document, DocumentChunk, EmbeddingMetadata
from app.schemas.document import DocumentResponse, DocumentUploadResponse
from app.services.parser_service import ParserService
from app.services.chunk_service import ChunkService
from app.services.embedding_service import EmbeddingService
from app.utils.auth import get_current_user, require_admin
from app.utils.audit import record_audit
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["Documents"])

parser_service = ParserService()
chunk_service = ChunkService()
embedder = EmbeddingService()


def _remove_file(path: str) -> None:
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except OSError:
        logger.warning(f"Could not remove uploaded file: {path}")


@router.post("/upload", response_model=DocumentUploadResponse, status_code=201)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if not parser_service.validate_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {sorted(parser_service.ALLOWED_EXTENSIONS)}",
        )

    file_type = parser_service.get_file_type(file.filename)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    file_content = await file.read()

    if len(file_content) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    file_ext = os.path.splitext(file.filename)[1]
    stored_filename = f"{uuid.uuid4().hex}{file_ext}"
    upload_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    async with aiofiles.open(upload_path, "wb") as f:
        await f.write(file_content)

    try:
        import io

        file_stream = io.BytesIO(file_content)
        raw_text = await parser_service.extract_text(file_stream, file.filename)

        if not raw_text.strip():
            raise HTTPException(
                status_code=400, detail="No text could be extracted from the file"
            )

        chunks = await asyncio.to_thread(chunk_service.chunk_text, raw_text)
        if len(chunks) > settings.MAX_CHUNKS_PER_DOCUMENT:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Document produces too many chunks "
                    f"({len(chunks)} > {settings.MAX_CHUNKS_PER_DOCUMENT}). "
                    "Split it into smaller files."
                ),
            )

        document = Document(
            filename=stored_filename,
            original_filename=file.filename,
            file_type=file_type,
            file_size=len(file_content),
            file_path=upload_path,
            user_id=current_user.id,
            description=description,
            chunk_count=len(chunks),
        )
        db.add(document)
        await db.flush()
        await db.refresh(document)

        chroma_collection = get_collection()
        chunk_ids = []
        chunk_texts = []
        chunk_metadatas = []
        # Encode all chunks in one batch so the stored vectors come from the same
        # model that is used at query time (sentence-transformers, not Chroma's
        # default embedding function).
        chunk_embeddings = await asyncio.to_thread(embedder.embed_batch, chunks)

        for idx, chunk_text in enumerate(chunks):
            doc_chunk = DocumentChunk(
                document_id=document.id,
                chunk_index=idx,
                chunk_text=chunk_text,
                token_count=chunk_service.estimate_tokens(chunk_text),
            )
            db.add(doc_chunk)
            await db.flush()
            await db.refresh(doc_chunk)

            embedding = chunk_embeddings[idx]
            embed_meta = EmbeddingMetadata(
                chunk_id=doc_chunk.id,
                document_id=document.id,
                model_name=settings.EMBEDDING_MODEL_NAME,
                dimension=len(embedding),
                vector_id=f"doc_{document.id}_chunk_{idx}",
            )
            db.add(embed_meta)

            chunk_ids.append(f"doc_{document.id}_chunk_{idx}")
            chunk_texts.append(chunk_text)
            chunk_metadatas.append(
                {
                    "document_id": str(document.id),
                    "chunk_id": str(doc_chunk.id),
                    "filename": document.original_filename,
                    "source": document.original_filename,
                    "chunk_index": idx,
                    "file_type": file_type,
                }
            )

        await asyncio.to_thread(
            chroma_collection.add,
            ids=chunk_ids,
            documents=chunk_texts,
            metadatas=chunk_metadatas,
            embeddings=chunk_embeddings,
        )

        logger.info(
            f"Uploaded {file.filename}: {len(chunks)} chunks, {len(file_content)} bytes"
        )
        await record_audit(
            db,
            user=current_user,
            action="document.uploaded",
            entity_type="document",
            entity_id=document.id,
            detail={
                "original_filename": document.original_filename,
                "chunks": len(chunks),
                "bytes": len(file_content),
            },
            request=request,
        )
        await db.flush()
    except HTTPException:
        _remove_file(upload_path)
        raise
    except Exception:
        _remove_file(upload_path)
        logger.exception(f"Failed to index {file.filename}")
        raise HTTPException(
            status_code=500,
            detail="The document could not be indexed. Please check the server logs.",
        )

    return DocumentUploadResponse(
        id=document.id,
        filename=stored_filename,
        original_filename=document.original_filename,
        file_type=file_type,
        file_size=len(file_content),
        chunk_count=len(chunks),
        message=f"Successfully processed {file.filename} with {len(chunks)} chunks",
    )


@router.get("/documents", response_model=list[DocumentResponse])
async def list_documents(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Document)
        .order_by(desc(Document.created_at), desc(Document.id))
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(
    document_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    chroma_collection = get_collection()
    try:
        await asyncio.to_thread(
            chroma_collection.delete, where={"document_id": str(document_id)}
        )
    except Exception as e:
        logger.warning(f"ChromaDB delete warning: {e}")

    await asyncio.to_thread(_remove_file, doc.file_path)

    filename = doc.original_filename
    await db.delete(doc)
    await db.flush()
    await record_audit(
        db,
        user=current_user,
        action="document.deleted",
        entity_type="document",
        entity_id=document_id,
        detail={"original_filename": filename},
        request=request,
    )
    logger.info(f"Deleted document {document_id}: {filename}")
