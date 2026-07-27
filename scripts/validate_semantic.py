from __future__ import annotations

import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
EXERCISE = ROOT / "exercises" / "TR-UVOF-001" / "semantic.json"
SCHEMA = ROOT / "schema" / "traca.semantic.schema.v1.0.json"
OUTPUT = ROOT / "exercises" / "TR-UVOF-001" / "validation.json"


def validate() -> dict:
    document = json.loads(EXERCISE.read_text(encoding="utf-8"))
    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(document), key=lambda error: list(error.path))
    report = {
        "exercise": document.get("identificacio", {}).get("id"),
        "schema": schema.get("$id"),
        "valid": not errors,
        "structural_errors": [
            {
                "code": "SCHEMA_ERROR",
                "path": "/".join(str(part) for part in error.path),
                "message": error.message,
            }
            for error in errors
        ],
        "summary": {"structural_error_count": len(errors)},
        "geometry_generated": False,
        "render_generated": False,
    }
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return report


def main() -> int:
    report = validate()
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["valid"] else 1


if __name__ == "__main__":
    sys.exit(main())
