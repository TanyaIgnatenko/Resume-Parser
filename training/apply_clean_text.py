import json
import sys

import re

CID = re.compile(r"\(cid:\d+\)")
# replace "-\n" with a space (instead of removing)
DEHYPH_LINE = re.compile(r"-\s*\n\s*")

def clean_text(s: str) -> str:
    # normalize newlines
    s = s.replace("\r\n", "\n").replace("\r", "\n")
    
    # remove CID artifacts
    s = CID.sub(" ", s)
    
    # fix words split by newline without hyphen (e.g., "Machine\nLearning")
    s = re.sub(r"([a-z])\n([a-z])", r"\1 \2", s, flags=re.I)
    
    # collapse multiple spaces/tabs → single space
    s = re.sub(r"[ \t]+", " ", s)
    
    # collapse 3+ newlines → just 2 newlines
    s = re.sub(r"\n{3,}", "\n\n", s)
    
    return s.strip()

def main(in_path, out_path):
    with open(in_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    cleaned = []
    for obj in data:
        raw = obj.get("text", "")
        obj["text"] = clean_text(raw)
        cleaned.append(obj)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)

    print(f"Cleaned {len(cleaned)} resumes → {out_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python apply_clean_text.py input.json output.json")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
