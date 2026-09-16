.PHONY: lint lint-frontend lint-backend lint-fix

lint: lint-frontend lint-backend

lint-frontend:
	cd frontend && npm run lint && npm run typecheck

lint-backend:
	cd backend && ruff check app && ruff format --check app && mypy app

lint-fix:
	cd frontend && npm run lint:fix
	cd backend && ruff check --fix app && ruff format app
