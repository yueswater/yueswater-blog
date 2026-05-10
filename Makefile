PYTHON     := .venv/bin/python3
QUARTO_ENV := QUARTO_PYTHON=$(PYTHON)

.PHONY: help install preview build clean new

help:
	@echo "Usage:"
	@echo "  make install                        Set up Python venv and install dependencies"
	@echo "  make preview                        Start Quarto dev server"
	@echo "  make build                          Build the site"
	@echo "  make clean                          Remove build output"
	@echo "  make new series=<s> slug=<slug>     Create a new article scaffold"
	@echo ""
	@echo "  new options:"
	@echo "    series=latex|python               (required) Article series"
	@echo "    slug=my-article                   (required) URL slug / folder name"
	@echo "    title=\"中文標題\"                 (optional) Chinese title"
	@echo "    title_en=\"English Title\"         (optional) English title"
	@echo "    date=2026-05-10                   (optional) Defaults to today"
	@echo ""
	@echo "  Example:"
	@echo "    make new series=latex slug=math-equations title=\"數學公式排版\""

install:
	python3 -m venv .venv
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install jupyter pyyaml numpy

preview:
	$(QUARTO_ENV) quarto preview

build:
	$(QUARTO_ENV) quarto render

clean:
	rm -rf _site .quarto

new:
	@[ -n "$(series)" ] || { echo "Error: series is required (e.g. series=latex)"; exit 1; }
	@[ -n "$(slug)" ]   || { echo "Error: slug is required (e.g. slug=math-equations)"; exit 1; }
	@$(PYTHON) scripts/new_article.py \
		--series "$(series)" \
		--slug   "$(slug)" \
		$(if $(title),    --title    "$(title)") \
		$(if $(title_en), --title-en "$(title_en)") \
		$(if $(date),     --date     "$(date)")
