import argparse
import re
import spacy
from spacy.tokens import DocBin
from typing import List, Tuple, Set, Dict


TARGET_LABELS = {"Skill", "Work_Experience", "Education", "Language"}


def load_docs(spacy_path: str, nlp) -> List:
    db = DocBin().from_disk(spacy_path)
    return list(db.get_docs(nlp.vocab))


def guess_name(text: str) -> str:
    """
    Heuristic: take the first short line with 2–4 title-cased words as a 'name'.
    Fallback to first non-empty line.
    """
    for line in text.splitlines():
        s = line.strip()
        if not s:
            continue
        words = s.split()
        titled = sum(1 for w in words if w[:1].isupper())
        if 2 <= len(words) <= 4 and titled >= 2 and len(s) <= 60:
            return s
        # Extra: many resumes start with a single line name in ALL CAPS
        if 2 <= len(words) <= 4 and s.isupper() and len(s) <= 60:
            return s.title()
        # Emails/phones/links are unlikely names; skip those
        if re.search(r"@|https?://|linkedin\.com|github\.com|\+?\d", s):
            continue
        # If looks like “Firstname Lastname — …” keep the name part
        m = re.match(r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b", s)
        if m:
            return m.group(1)
    # fallback
    for line in text.splitlines():
        if line.strip():
            return line.strip()[:60]
    return "Unknown"


def ents_as_set(doc) -> Set[Tuple[int, int, str]]:
    return {(ent.start_char, ent.end_char, ent.label_) for ent in doc.ents}


def index_by_span(spans: Set[Tuple[int, int, str]]) -> Dict[Tuple[int, int], str]:
    d = {}
    for s, e, lab in spans:
        d[(s, e)] = lab
    return d


def main():
    ap = argparse.ArgumentParser(description="Print spaCy NER mismatches per resume.")
    ap.add_argument("--model", default="D:/resumes/50/models/resume_ner_en/model-best", help="Path to trained spaCy pipeline, e.g. D:/models/resume_ner_en/model-best")
    ap.add_argument("--test", default="D:/resumes/50/spacy_data/test.spacy", help="Path to test.spacy")
    ap.add_argument("--only", nargs="*", default=None, help="Optional whitelist of labels to consider (default: Skill Work_Experience Education Language)")
    args = ap.parse_args()

    nlp = spacy.load(args.model)
    docs = load_docs(args.test, nlp)

    labels = set(args.only) if args.only else TARGET_LABELS

    resume_idx = 0
    any_output = False

    for gold_doc in docs:
        resume_idx += 1
        text = gold_doc.text

        # Run model
        pred_doc = nlp(text)

        # Filter to target labels
        gold_spans = {(s, e, lab) for (s, e, lab) in ents_as_set(gold_doc) if lab in labels}
        pred_spans = {(s, e, lab) for (s, e, lab) in ents_as_set(pred_doc) if lab in labels}

        gold_by_span = index_by_span(gold_spans)
        pred_by_span = index_by_span(pred_spans)

        mismatches: List[Tuple[str, str, str]] = []

        # 1) Gold entities: check if predicted at same span
        for (s, e), gold_lab in gold_by_span.items():
            pred_lab = pred_by_span.get((s, e))
            frag = text[s:e]
            if pred_lab is None:
                mismatches.append((frag, "No label", gold_lab))
            elif pred_lab != gold_lab:
                mismatches.append((frag, pred_lab, gold_lab))

        # 2) Predicted entities with no gold at same span (false positives)
        for (s, e), pred_lab in pred_by_span.items():
            if (s, e) not in gold_by_span:
                frag = text[s:e]
                mismatches.append((frag, pred_lab, "No label"))

        if mismatches:
            any_output = True
            name = guess_name(text)
            print(f"Resume # {resume_idx} {name}")
            for frag, pred_lab, gold_lab in mismatches:
                frag_clean = " ".join(frag.split())
                print(f"\"{frag_clean}\" \"{pred_lab}\" \"{gold_lab}\"")
            print()  # blank line between resumes

    if not any_output:
        print("No mismatches found — predictions match gold spans exactly for the selected labels.")


if __name__ == "__main__":
    main()
