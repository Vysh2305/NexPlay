# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Sports League Management Platform with AI-assisted player auction and team formation.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, TanStack Query, Wouter, Framer Motion, Recharts, Lucide

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── league-platform/    # React + Vite frontend (root /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
└── scripts/                # Utility scripts
```

## User Roles

- **Admin** — Full control: games, franchises, players, auctions, matches, fouls, bans, stats
- **Franchise Owner** — Auction bidding, team management, AI recommendations, leaderboard
- **Player** — Register for games, view team/stats/schedule, track fouls

## Test Accounts

- **Admin**: admin@league.pro / admin123
- **Franchise Owner**: manchester@league.pro / pass123
- **Player**: player1@league.pro / pass123 (through player5@league.pro)

## Key Features

- Role-based auth via JWT
- Silent-bid auction system with budget enforcement
- AI recommendation engine: Score = 0.4×Skill + 0.4×Performance + 0.2×Discipline
- Foul system: minor (-5 pts), major (-15 pts) discipline deduction
- Live match tracking (status: scheduled/live/completed)
- Leaderboard by wins/points per game

## Database Schema

Tables: users, games, player_profiles, franchises, team_players, auctions, bids, matches, fouls

## API

Base path: `/api` — Full OpenAPI spec in `lib/api-spec/openapi.yaml`

### Run codegen after spec changes:
```
pnpm --filter @workspace/api-spec run codegen
```

### Push DB schema:
```
pnpm --filter @workspace/db run push
```

## Routes (api-server)

- `/api/auth/*` — Login, register, logout, me
- `/api/games/*` — Game CRUD + enroll
- `/api/players/*` — Player profiles, ban
- `/api/franchises/*` — Franchise CRUD, team management
- `/api/auctions/*` — Auction lifecycle + bidding
- `/api/matches/*` — Match schedule + results
- `/api/fouls` — Foul management
- `/api/recommendations` — AI player scoring
- `/api/leaderboard` — Rankings
- `/api/admin/stats` — Dashboard stats
