PYTHON     := .venv/bin/python3
QUARTO_ENV := QUARTO_PYTHON=$(PYTHON)

.PHONY: help install preview build clean

help:
	@echo "Usage:"
	@echo "  make install   Set up Python venv and install dependencies"
	@echo "  make preview   Start Quarto dev server"
	@echo "  make build     Build the site"
	@echo "  make clean     Remove build output"

install:
	python3 -m venv .venv
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install jupyter pyyaml

preview:
	$(QUARTO_ENV) quarto preview

build:
	$(QUARTO_ENV) quarto render

clean:
	rm -rf _site .quarto
