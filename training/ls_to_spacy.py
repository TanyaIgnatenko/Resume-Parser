import sys, json, srsly, pathlib
from spacy.tokens import DocBin
import spacy

TARGET_LABELS = {"Skill", "Work_Experience", "Education", "Language"}

def iter_tasks(obj):
    """Yield Label Studio task objects from either JSON array or JSONL file."""
    p = pathlib.Path(obj)
    txt = p.read_text(encoding="utf-8-sig")
    if txt.lstrip().startswith("["):
        for rec in json.loads(txt):
            yield rec
    else:
        for line in txt.splitlines():
            line = line.strip()
            if not line: 
                continue
            yield json.loads(line)

def extract_spans(task, use_predictions=False):
    """
    Return list of (start, end, label) from a LS task.
    If your export stores gold labels under 'annotations', keep use_predictions=False.
    If yours uses 'predictions', set use_predictions=True.
    """
    key = "predictions" if use_predictions else "annotations"
    spans = []
    for ann in task.get(key, []):
        for r in ann.get("result", []):
            if r.get("type") != "labels":
                continue
            labels = r["value"].get("labels", [])
            if not labels:
                continue
            label = labels[0]
            if label not in TARGET_LABELS:
                continue
            start = r["value"]["start"]
            end = r["value"]["end"]
            spans.append((start, end, label))
    return spans

def make_docbin(nlp, tasks, use_predictions=False):
    db = DocBin(store_user_data=False)
    bad, good = 0, 0
    for t in tasks:
        text = (t.get("data") or {}).get("text") or t.get("text") or ""
        if not text:
            continue
        doc = nlp.make_doc(text)
        ents = []
        spans = extract_spans(t, use_predictions=use_predictions)
        # filter overlapping/invalid spans
        char_taken = [False] * (len(text) + 1)
        for start, end, label in sorted(spans, key=lambda x: (x[0], x[1])):
            if start >= end or end > len(text):
                continue
            if any(char_taken[start:end]):
                continue
            span = doc.char_span(start, end, label=label, alignment_mode="contract")
            if span is None:
                continue
            for i in range(start, end):
                char_taken[i] = True
            ents.append(span)
        doc.ents = ents
        if ents:
            good += 1
        else:
            bad += 1
        db.add(doc)
    print(f"Built {good} docs with entities; {bad} had none.")
    return db

def main():
    if len(sys.argv) < 6:
        print("Usage: python ls_to_spacy.py <lang:en|de> <input_train.json[l]> <input_dev.json[l]> <input_test.json[l]> <out_dir> [--use-pred]")
        sys.exit(2)
    
    lang, train_in, dev_in, test_in, out_dir = sys.argv[1:6]
    use_pred = ("--use-pred" in sys.argv)

    model = "en_core_web_sm" if lang == "en" else "de_core_news_sm"
    nlp = spacy.blank("en") if lang == "en" else spacy.blank("de")  # tokenizer base for Doc creation

    train_tasks = list(iter_tasks(train_in))
    dev_tasks = list(iter_tasks(dev_in))
    test_tasks = list(iter_tasks(test_in))

    out = pathlib.Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)

    train_db = make_docbin(nlp, train_tasks, use_predictions=use_pred)
    dev_db = make_docbin(nlp, dev_tasks, use_predictions=use_pred)
    test_db = make_docbin(nlp, test_tasks, use_predictions=use_pred)

    train_db.to_disk(out / "train.spacy")
    dev_db.to_disk(out / "dev.spacy")
    test_db.to_disk(out / "test.spacy")

    print(f"Wrote {out/'train.spacy'}, {out/'dev.spacy'}, and {out/'test.spacy'}")

if __name__ == "__main__":
    main()