import asyncio
import os
import tempfile
from pathlib import Path
from typing import BinaryIO

from app.utils.logger import get_logger

logger = get_logger(__name__)


class ParserService:

    ALLOWED_EXTENSIONS = {".txt", ".pdf", ".docx", ".md"}

    @staticmethod
    def validate_file(filename: str) -> bool:
        ext = Path(filename).suffix.lower()
        return ext in ParserService.ALLOWED_EXTENSIONS

    @staticmethod
    def get_file_type(filename: str) -> str:
        ext = Path(filename).suffix.lower()
        if ext in (".txt", ".md"):
            return ext.lstrip(".")
        elif ext == ".pdf":
            return "pdf"
        elif ext == ".docx":
            return "docx"
        return "unknown"

    @staticmethod
    async def extract_text(file: BinaryIO, filename: str) -> str:
        """Extract text without blocking the event loop.

        PDF/DOCX libraries are synchronous and CPU-heavy, so the work runs in a
        worker thread.
        """
        data = file.read()
        ext = Path(filename).suffix.lower()
        if ext in (".txt", ".md"):
            text = await asyncio.to_thread(ParserService._extract_txt, data)
        elif ext == ".pdf":
            text = await asyncio.to_thread(ParserService._extract_pdf, data)
        elif ext == ".docx":
            text = await asyncio.to_thread(ParserService._extract_docx, data)
        else:
            raise ValueError(f"Unsupported file type: {ext}")

        logger.info(f"Extracted {len(text)} chars from {ext}")
        return text

    @staticmethod
    def _extract_txt(data: bytes) -> str:
        return data.decode("utf-8", errors="replace")

    @staticmethod
    def _extract_pdf(data: bytes) -> str:
        text = ""
        try:
            import pdfplumber

            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                tmp.write(data)
                tmp_path = tmp.name
            try:
                with pdfplumber.open(tmp_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
            finally:
                os.unlink(tmp_path)
            return text
        except ImportError:
            pass

        logger.warning("pdfplumber not available, falling back to PyMuPDF")
        try:
            import fitz
        except ImportError:
            raise ImportError("No PDF library available. Install pdfplumber or PyMuPDF.")

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(data)
            tmp_path = tmp.name
        try:
            doc = fitz.open(tmp_path)
            for page in doc:
                text += page.get_text()
            doc.close()
        finally:
            os.unlink(tmp_path)
        return text

    @staticmethod
    def _extract_docx(data: bytes) -> str:
        try:
            import docx
        except ImportError:
            raise ImportError("python-docx is required to parse .docx files.")

        with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
            tmp.write(data)
            tmp_path = tmp.name
        try:
            document = docx.Document(tmp_path)
            return "\n".join(p.text for p in document.paragraphs)
        finally:
            os.unlink(tmp_path)
