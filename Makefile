.PHONY: install validate test check interface

install:
	python -m pip install -r requirements.txt

validate:
	python scripts/validate_semantic.py

test:
	python -m pytest -q

check: validate test

interface:
	python -m http.server 8000 --directory interface
