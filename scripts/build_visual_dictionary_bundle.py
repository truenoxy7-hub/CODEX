from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "knowledge/visual-functional-dictionary.v0.2.json"
TARGET = ROOT / "interface/data/visual-functional-dictionary.js"
STYLE_SOURCE = ROOT / "config/visual-style.v0.1.json"
STYLE_TARGET = ROOT / "interface/data/visual-style.js"


def write_bundle(source: Path, target: Path, global_name: str) -> None:
    document = json.loads(source.read_text(encoding="utf-8"))
    payload = json.dumps(document, ensure_ascii=False, indent=2)
    target.write_text(
        "(function (root, factory) {\n"
        "  const documentValue = factory();\n"
        "  if (typeof module === \"object\" && module.exports) module.exports = documentValue;\n"
        f"  root.{global_name} = documentValue;\n"
        "})(typeof globalThis !== \"undefined\" ? globalThis : this, function () {\n"
        "  \"use strict\";\n"
        f"  return {payload};\n"
        "});\n",
        encoding="utf-8",
    )


def build() -> None:
    write_bundle(SOURCE, TARGET, "TRACA_VISUAL_FUNCTIONAL_DICTIONARY")
    write_bundle(STYLE_SOURCE, STYLE_TARGET, "TRACA_VISUAL_STYLE")


if __name__ == "__main__":
    build()
