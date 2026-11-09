HEXO := node_modules/.bin/hexo

.PHONY: help install preview build clean new deploy reports reports-upload

help:
	@echo "Usage:"
	@echo "  make install              Install Node dependencies"
	@echo "  make preview              Start Hexo dev server (http://localhost:4000)"
	@echo "  make build                Generate the static site into public/"
	@echo "  make reports              Convert every post to a PDF into reports/out/ (not tracked)"
	@echo "  make reports-upload       Upload reports/out/ to Supabase Storage (needs SUPABASE_SERVICE_ROLE_KEY in .env)"
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

# PDF editions of every post: Markdown -> Typst -> reports/out/<post>/<zh|en>.pdf (needs the typst CLI), then Supabase Storage
reports:
	node reports/tools/build.mjs

reports-upload:
	node reports/tools/upload.mjs
