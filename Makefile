.PHONY: install validate test check

install:
	python -m pip install -r requirements.txt

validate:
	python scripts/validate_semantic.py

test:
	python -m pytest -q

check: validate test
