# Acquisitions API

A modern, secure Node.js/Express REST API boilerplate focused on authentication, user management, security hardening, observability, and developer productivity. Built with Express 5, Drizzle ORM, Neon serverless Postgres, and Zod validations.

## Highlights
- Production‑ready Express 5 setup (Helmet, CORS, Cookie Parser, Morgan)
- Authentication via JWT stored in httpOnly cookies
- Role‑based access control (RBAC): user, admin
- Users CRUD with strict input validation using Zod
- Secure by default: Arcjet bot detection, shielding, and adaptive rate limiting
- Postgres with Drizzle ORM (Neon serverless driver)
- Structured logging with Winston + HTTP logs via Morgan
- Health, uptime, and base API endpoints
- Testing with Jest + Supertest, GitHub Actions CI
- Dockerized for development and production

## Tech Stack
- Runtime: Node.js 18+
- Framework: Express 5
- Database: PostgreSQL (Neon serverless driver `@neondatabase/serverless`)
- ORM: Drizzle ORM
- Auth: JSON Web Tokens (JWT) in httpOnly cookies
- Validation: Zod
- Security: Helmet, CORS, Arcjet (bot detection, shield, rate limiting)
- Passwords: bcrypt hashing
- Logging: Winston (files + console in non‑prod), Morgan HTTP access logs
- Testing: Jest, Supertest
- Lint/Format: ESLint, Prettier
- Container: Docker, docker‑compose
- CI: GitHub Actions (lint, format check, tests with coverage)

## API Overview
Base URL: http://localhost:3000

Public endpoints:
- GET / → Hello from Acquisitions API! (quick sanity check)
- GET /health → { status, timestamp, uptime }
- GET /api → { message: 'Acquisitions API is running' }

Auth endpoints: prefix /api/auth
- POST /sign-up → Register a user; sets JWT cookie on success
- POST /sign-in → Authenticate; sets JWT cookie on success
- POST /sign-out → Clears JWT cookie

Users endpoints: prefix /api/users (require authentication)
- GET / → Get all users
- GET /:id → Get user by ID
- PUT /:id → Update user by ID (users can update themselves; only admins can change roles)
- DELETE /:id → Delete user by ID (admin only; cannot delete self)

Notes:
- JWT is read from httpOnly cookie named token
- Role guard middleware ensures only allowed roles can access certain actions
- Zod validations ensure correct payloads and parameter types

## Major Features and Behaviors
- Authentication
  - Sign‑up: validates payload, hashes password (bcrypt), stores user, returns safe user fields and sets JWT cookie
  - Sign‑in: validates payload, verifies credentials, returns safe user fields and sets JWT cookie
  - Sign‑out: clears JWT cookie
- Authorization (RBAC)
  - authenticateToken middleware decodes JWT from cookie and attaches req.user
  - requireRole(['admin']) limits specific routes to admins
- Users Management
  - Get all users, get user by id
  - Update with field‑level rules; non‑admins cannot change role; email uniqueness enforced
  - Admin‑only deletion; admins cannot delete their own account
- Security Middleware (Arcjet)
  - Bot and shield protections
  - Sliding window rate limiting, adaptive per role (guest/user/admin)
- Observability
  - Winston logger (console in dev, files in logs/)
  - Morgan access logs piped to Winston
  - Health endpoint with uptime

## Project Structure
- src/app.js → Express app wiring, middlewares, routes, health endpoints
- src/server.js → Bootstraps HTTP server
- src/routes/ → Route definitions (auth.routes.js, users.routes.js)
- src/controllers/ → Request handlers (auth.controller.js, users.controller.js)
- src/services/ → Business logic (auth.services.js, users.services.js)
- src/models/ → Drizzle schema (user.model.js)
- src/config/ → database.js (Drizzle + Neon), logger.js (Winston), arcjet.js
- src/middlewares/ → auth.middleware.js (JWT, RBAC), security.middleware.js (Arcjet)
- src/utils/ → jwt.js, cookies.js, format.js
- src/validations/ → Zod schemas (auth.validation.js, users.validation.js)
- tests/ → Basic endpoint tests with Supertest

## Environment Variables
Create a .env file at the project root.

Required/common variables:
- PORT=3000
- DATABASE_URL=postgres://user:password@host:5432/dbname
- JWT_SECRET=your‑jwt‑secret
- JWT_EXPIRY=1d
- ARCJET_KEY=your‑arcjet‑key
- LOG_LEVEL=info
- NODE_ENV=development

The CI workflow uses TEST_DATABASE_URL, JWT_SECRET, LOG_LEVEL, NODE_ENV=test for test runs.

## Getting Started
Prerequisites:
- Node.js 18+
- PostgreSQL database (local or hosted, e.g., Neon)
- npm 10+

Install dependencies:
- npm ci

Database migrations (Drizzle):
- npx drizzle-kit generate
- npx drizzle-kit migrate
- npx drizzle-kit studio (optional UI)

Run locally:
- Development: npm run dev
- Production: npm start

Available scripts:
- dev → node --watch src/index.js
- start → node src/index.js
- lint → eslint .
- lint:fix → eslint . --fix
- format → prettier --write .
- format:check → prettier --check .
- db:generate → drizzle-kit generate
- db:migrate → drizzle-kit migrate
- db:studio → drizzle-kit studio
- test → cross-env NODE_OPTIONS=--experimental-vm-modules jest

## Docker
Build and run (production image):
- docker compose up --build

Details:
- Multi‑stage Dockerfile with separate development and production targets
- Health checks hitting /health
- Logs volume mounted to ./logs

## Continuous Integration
GitHub Actions workflow performs:
- ESLint and Prettier checks
- Jest tests with coverage
- Uploads coverage artifacts and posts a summary

## Security Notes
- JWT stored in httpOnly cookie; cookie options tighten in production
- Helmet and CORS enabled globally
- Arcjet shields against bots, abuse, and rate limits requests
- Never commit .env to version control

## Testing
- Run tests: npm test
- Uses Jest + Supertest; minimal tests validate /health, /api, and 404 behavior

## Troubleshooting
- Database connectivity: verify DATABASE_URL and that the database is reachable
- JWT errors: ensure JWT_SECRET and JWT_EXPIRY are set; clear cookies if tokens change
- Rate limiting/blocked: Arcjet rules can deny requests; review security.middleware.js and ARCJET_KEY
- Logs: check logs/combined.log and logs/error.log for details

## License
- ISC (see package.json). You can include a LICENSE file if distributing.
