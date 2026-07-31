.PHONY: help setup install dev build start lint typecheck test test-watch test-ci check ci smoke seed db-up db-down check-env

help:
	@echo "SINet development commands"
	@echo ""
	@echo "  make setup       Bootstrap project (install + env check)"
	@echo "  make install     npm install"
	@echo "  make dev         Start Next.js dev server"
	@echo "  make build       Production build"
	@echo "  make start       Run production build"
	@echo "  make lint        ESLint"
	@echo "  make typecheck   TypeScript check"
	@echo "  make test        Run unit tests"
	@echo "  make test-watch  Jest watch mode"
	@echo "  make test-ci     Jest with coverage"
	@echo "  make check       lint + typecheck + test"
	@echo "  make ci          Full CI pipeline locally"
	@echo "  make smoke       HTTP smoke tests (server must be running)"
	@echo "  make seed        Seed MongoDB"
	@echo "  make db-up       Start local MongoDB (Docker)"
	@echo "  make db-down     Stop local MongoDB"
	@echo "  make check-env   Validate environment variables"

setup:
	bash scripts/setup.sh

install:
	npm install

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

typecheck:
	npm run typecheck

test:
	npm test

test-watch:
	npm run test:watch

test-ci:
	npm run test:ci

check: lint typecheck test

ci: lint typecheck test-ci build

smoke:
	npm run smoke

seed:
	npm run seed:db

db-up:
	docker compose up -d

db-down:
	docker compose down

check-env:
	npm run check:env
