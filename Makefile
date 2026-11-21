HEXO := node_modules/.bin/hexo

.PHONY: help install preview build clean new deploy reports reports-upload \
	test test-core test-contact test-contact-unit test-contact-e2e \
	test-security test-security-e2e test-security-db supabase-up supabase-down

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
	@echo "Tests:"
	@echo "  make test                 All tests: core + contact + security"
	@echo "  make test-core            Site core unit tests (consent, traffic)"
	@echo "  make test-contact         Contact unit + e2e tests"
	@echo "  make test-contact-unit    Contact unit tests (node:test)"
	@echo "  make test-contact-e2e     Contact e2e tests (Playwright, Supabase mocked)"
	@echo "  make test-security        Security tests: browser + server side"
	@echo "  make test-security-e2e    Security browser tests (Playwright, Supabase mocked)"
	@echo "  make test-security-db     Security server-side tests (local Supabase only; skips if it is down)"
	@echo "  make supabase-up          Start local Supabase (needs Docker via colima) and apply migrations"
	@echo "  make supabase-down        Stop local Supabase"
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

test: test-core test-contact test-security

# Site core unit tests (tests/*.test.js: consent banner state, traffic helpers)
test-core:
	node --test tests/*.test.js

# Contact page tests. e2e reuses a dev server on :4123 or starts one; Supabase is always mocked.
test-contact: test-contact-unit test-contact-e2e

test-contact-unit:
	npm run -s test:contact:unit

test-contact-e2e:
	npm run -s test:contact:e2e

# Security tests. The server-side part only ever targets a local Supabase (see tests/security/README.md).
test-security: test-security-e2e test-security-db

test-security-e2e:
	npm run -s test:security:e2e

test-security-db:
	npm run -s test:security:db

supabase-up:
	@docker info >/dev/null 2>&1 || { echo "Docker is not running: run 'colima start' first."; exit 1; }
	# vector/logflare (log analytics) mount the Docker socket, which fails under Colima; tests don't need them
	supabase start -x vector,logflare
	supabase db reset --local

supabase-down:
	supabase stop
