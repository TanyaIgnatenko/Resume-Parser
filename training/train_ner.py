import argparse, pathlib
from spacy.cli.train import train as spacy_train

CFG_TEMPLATE = r"""
[paths]
train = "<<TRAIN_PATH>>"
dev   = "<<DEV_PATH>>"

[nlp]
lang = "<<LANG>>"
pipeline = ["tok2vec","ner"]

[components]

[components.tok2vec]
source = "<<BASE_MODEL>>"

[components.ner]
factory = "ner"

[components.ner.model]
@architectures = "spacy.TransitionBasedParser.v2"
state_type = "ner"
extra_state_tokens = false
hidden_width = 64
maxout_pieces = 2
use_upper = false
nO = null

[training]
dev_corpus = "corpora.dev"
train_corpus = "corpora.train"
seed = 42
optimizer = {"@optimizers":"Adam.v1"}
accumulate_gradient = 1
patience = 1600
max_steps = 2000
eval_frequency = 100
dropout = 0.2
gpu_allocator = "none"

[training.batcher]
@batchers = "spacy.batch_by_padded.v1"
discard_oversize = false
size = 2000
buffer = 256
get_length = null

[corpora]

[corpora.train]
@readers = "spacy.Corpus.v1"
path = ${paths.train}

[corpora.dev]
@readers = "spacy.Corpus.v1"
path = ${paths.dev}

[initialize]
[initialize.components]
[initialize.components.tok2vec]
source = "<<BASE_MODEL>>"
# (No explicit labels here; spaCy will infer from train.spacy)
"""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", choices=["en","de"], default="en")
    ap.add_argument("--train", required=True, help="Path to train.spacy")
    ap.add_argument("--dev", required=True, help="Path to dev.spacy")
    ap.add_argument("--out", required=True, help="Output directory")
    ap.add_argument("--base", default=None,
                    help="Base model to borrow tok2vec from (default: en_core_web_sm/de_core_news_sm)")
    args = ap.parse_args()

    base = args.base or ("en_core_web_sm" if args.lang=="en" else "de_core_news_sm")

    cfg_text = CFG_TEMPLATE
    cfg_text = cfg_text.replace("<<TRAIN_PATH>>", str(pathlib.Path(args.train).resolve()))
    cfg_text = cfg_text.replace("<<DEV_PATH>>",   str(pathlib.Path(args.dev).resolve()))
    cfg_text = cfg_text.replace("<<LANG>>",       args.lang)
    cfg_text = cfg_text.replace("<<BASE_MODEL>>", base)

    out_dir = Path(args.out).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    def p(pth): return Path(pth).resolve().as_posix()
    cfg_text = cfg_text.replace("<<TRAIN_PATH>>", p(args.train))
    cfg_text = cfg_text.replace("<<DEV_PATH>>",   p(args.dev))

    cfg_path = out_dir / "config.auto.cfg"
    cfg_path.write_text(cfg_text, encoding="utf-8")

    spacy_train(
        config_path=str(cfg_path),
        output_path=str(out_dir),
        overrides={"training.gpu_allocator": "none"},
        use_gpu=-1
    )

if __name__ == "__main__":
    main()
