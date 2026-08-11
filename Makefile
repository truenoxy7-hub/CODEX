.PHONY: install validate test check geometry interface

install:
	python -m pip install -r requirements.txt

validate:
	python scripts/validate_semantic.py

test:
	python -m pytest -q

check: validate test

geometry:
	python scripts/resolve_geometry.py

interface: geometry
	python -m http.server 8000 --directory interface
