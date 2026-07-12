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
        ext = Path(filename).suffix.lower()
        if ext in (".txt", ".md"):
            return await ParserService._extract_txt(file)
        elif ext == ".pdf":
            return await ParserService._extract_pdf(file)
        elif ext == ".docx":
            return await ParserService._extract_docx(file)
        else:
            raise ValueError(f"Unsupported file type: {ext}")

    @staticmethod
    async def _extract_txt(file: BinaryIO) -> str:
        content = file.read().decode("utf-8", errors="replace")
        logger.info(f"Extracted {len(content)} chars from TXT")
        return content

    @staticmethod
    async def _extract_pdf(file: BinaryIO) -> str:
        text = ""
        try:
            import pdfplumber
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                tmp.write(file.read())
                tmp_path = tmp.name
            try:
                with pdfplumber.open(tmp_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
            finally:
                os.unlink(tmp_path)
        except ImportError:
            logger.warning("pdfplumber not available, falling back to PyMuPDF")
            try:
                import fitz
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                    tmp.write(file.read())
                    tmp_path = tmp.name
                try:
                    doc = fitz.open(tmp_path)
                    for page in doc:
                        text += page.get_text()
                    doc.close()
                finally:
                    os.unlink(tmp_path)
            except ImportError:
                raise ImportError("No PDF library available. Install pdfplumber or PyMuPDF.")
        logger.info(f"Extracted {len(text)} chars from PDF")
        return text

    @staticmethod
    async def _extract_docx(file: BinaryIO) -> str:
        try:
            import docx
            with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
                tmp.write(file.read())
                tmp_path = tmp.name
            try:
                doc = docx.Document(tmp_path)
                text = "\n".join(p.text for p in doc.paragraphs)
            finally:
                os.unlink(tmp_path)
        except ImportError:
            raise ImportError("python-docx is required to parse .docx files.")
        logger.info(f"Extracted {len(text)} chars from DOCX")
        return text
