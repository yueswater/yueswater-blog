HEXO := node_modules/.bin/hexo

.PHONY: help install preview build clean new deploy

help:
	@echo "Usage:"
	@echo "  make install              Install Node dependencies"
	@echo "  make preview              Start Hexo dev server (http://localhost:4000)"
	@echo "  make build                Generate the static site into public/"
	@echo "  make clean                Remove generated site and database"
	@echo "  make new title=\"...\"      Create a new post scaffold"
	@echo ""
	@echo "  Example:"
	@echo "    make new title=\"新文章標題\""

install:
	npm install

preview: clean
	$(HEXO) server

build: clean
	$(HEXO) generate

clean:
	$(HEXO) clean

new:
	@[ -n "$(title)" ] || { echo "Error: title is required (e.g. title=\"我的新文章\")"; exit 1; }
	@$(HEXO) new post "$(title)"
