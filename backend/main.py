import io
import os
import re
import tempfile
from pathlib import Path
from typing import Dict, List

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import spacy
import pdfplumber
import docx2txt

# ---------- Config ----------
MODEL_DIR = Path(__file__).parent / "model"   # <- relative path inside repo
MAX_FILE_SIZE_MB = 10
ALLOWED_EXT = {".pdf", ".docx", ".txt"}

app = FastAPI(title="Resume Parser API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load spaCy model once at startup
try:
    nlp = spacy.load(str(MODEL_DIR))
except Exception as e:
    raise RuntimeError(f"Failed to load spaCy model from {MODEL_DIR}: {e}")

CID = re.compile(r"\(cid:\d+\)")

def clean_text(s: str) -> str:
    if not s:
        return ""
    s = s.replace("\r\n", "\n").replace("\r", "\n")
    s = CID.sub(" ", s)
    s = re.sub(r"([a-z])\n([a-z])", r"\1 \2", s, flags=re.I)
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()

def read_txt(bytes_data: bytes) -> str:
    return bytes_data.decode("utf-8", errors="ignore")

def read_docx(bytes_data: bytes) -> str:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".docx", dir="/tmp") as tmp:
        tmp.write(bytes_data)
        tmp_path = tmp.name
    try:
        text = docx2txt.process(tmp_path) or ""
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
    return text

def read_pdf(bytes_data: bytes) -> str:
    text_parts: List[str] = []
    with io.BytesIO(bytes_data) as bio:
        with pdfplumber.open(bio) as pdf:
            for page in pdf.pages:
                text_parts.append(page.extract_text(x_tolerance=1, y_tolerance=1, layout=True) or "")
    return "\n".join(text_parts)

def extract_text(file: UploadFile, raw: bytes) -> str:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {suffix}")
    if suffix == ".txt":
        return read_txt(raw)
    if suffix == ".docx":
        return read_docx(raw)
    if suffix == ".pdf":
        return read_pdf(raw)
    return ""

def group_entities(doc) -> Dict[str, List[str]]:
    buckets: Dict[str, List[str]] = {"Skill": [], "Work_Experience": [], "Education": [], "Language": []}
    for ent in doc.ents:
        if ent.label_ in buckets:
            buckets[ent.label_].append(ent.text.strip())
    # dedupe
    for k, vals in buckets.items():
        seen, uniq = set(), []
        for v in vals:
            key = v.lower()
            if key not in seen:
                seen.add(key)
                uniq.append(v)
        buckets[k] = uniq
    return buckets

@app.get("/health")
def health():
    return {"status": "ok", "model": str(MODEL_DIR), "labels": nlp.pipe_labels.get("ner", [])}

@app.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
    raw = await file.read()
    size_mb = len(raw) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=413, detail=f"File too large ({size_mb:.1f} MB). Max is {MAX_FILE_SIZE_MB} MB.")

    try:
        text = extract_text(file, raw)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")

    text = clean_text(text)
    if not text or len(text) < 30:
        raise HTTPException(status_code=400, detail="Resume text appears empty or too short after parsing.")

    doc = nlp(text)
    grouped = group_entities(doc)

    return JSONResponse(
        {
            "filename": file.filename,
            "length_chars": len(text),
            "data": {
                "text": text,
                "entities": grouped,
            },
        }
    )
