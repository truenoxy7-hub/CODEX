from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "knowledge/visual-functional-dictionary.v0.1.json"
TARGET = ROOT / "interface/data/visual-functional-dictionary.js"


def build() -> None:
    dictionary = json.loads(SOURCE.read_text(encoding="utf-8"))
    payload = json.dumps(dictionary, ensure_ascii=False, indent=2)
    TARGET.write_text(
        "(function (root, factory) {\n"
        "  const dictionary = factory();\n"
        "  if (typeof module === \"object\" && module.exports) module.exports = dictionary;\n"
        "  root.TRACA_VISUAL_FUNCTIONAL_DICTIONARY = dictionary;\n"
        "})(typeof globalThis !== \"undefined\" ? globalThis : this, function () {\n"
        "  \"use strict\";\n"
        f"  return {payload};\n"
        "});\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    build()
