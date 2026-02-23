# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Syncer is a full-stack monorepo with a Rust backend (Axum) and React TypeScript frontend (Create React App). PostgreSQL database via Docker.

## Development Commands

### Database
```bash
docker-compose up -d          # Start PostgreSQL (port 5455, postgres/postgres, db: syncer)
```

### Backend (Rust, port 3100)
```bash
cd backend
cargo build                   # Build
cargo run                     # Run dev server
cargo test                    # Run tests
cargo clippy                  # Lint
cargo fmt                     # Format
```

### Frontend (React + TypeScript, port 3005)
```bash
cd frontend
npm start                     # Dev server (proxies API requests to localhost:3100)
npm test                      # Run tests in watch mode
npm run build                 # Production build
```

## Architecture

- **`backend/`** — Rust service using Axum 0.8, Tokio, SQLx 0.8 (PostgreSQL). Authentication via Argon2 password hashing + tower-sessions. Entry point: `src/main.rs`.
- **`frontend/`** — React 19 + TypeScript, styled with Tailwind CSS 4. Proxies to backend on port 3100. Entry point: `src/index.tsx`.
- **`docker-compose.yml`** — PostgreSQL 17 service with persistent volume.

## Key Patterns

- Frontend proxies API calls to backend via `"proxy": "http://localhost:3100"` in package.json
- SQLx is configured for compile-time query checking against PostgreSQL
- Backend uses `dotenvy` for environment variable loading
