## NexPlay – Smart Sports League & Auction Platform

NexPlay is a full-stack sports league management and auction platform built using a modern TypeScript monorepo architecture. It enables efficient handling of players, franchises, matches, auctions, and real-time interactions within a sports ecosystem.

The system is designed to simulate real-world league operations including player auctions, match scheduling, foul tracking, and notifications, making it ideal for sports organizations and competitive leagues.


## Key Features

* Role-based authentication (Admin, Franchise, User)
* Player auction system with bidding functionality
* Franchise and team management
* Match scheduling and game tracking
* Foul and rule violation tracking
* Notification system
* OpenAI integration (AI-based features support)
* Scalable API architecture with modular routes


## Project Architecture

This project follows a monorepo structure using pnpm workspaces:

```
NexPlay/
│
├── api-server/        → Backend (Node.js + TypeScript)
├── api-client-react/  → Frontend API client
├── api-zod/           → Shared API schemas 
├── db/                → Database configuration

```

## Tech Stack

### Backend

* Node.js
* TypeScript
* REST API architecture
* Modular routing system

### Frontend 

* React (API client structure)
* TypeScript

### Database

* SQL-based database


## Core Modules

* Authentication & Authorization
* Auctions & Bidding System
* Franchise Management
* Player Management
* Match & Game Handling
* Fouls Tracking
* Notifications
* Admin Controls

## How It Works

1. Users authenticate into the system
2. Admin creates auctions and manages league data
3. Franchises participate in bidding for players
4. Matches are scheduled and tracked
5. Fouls and events are recorded in real-time
6. Notifications keep users updated

## API Structure

The backend includes modular route handling:

* `/auth` → Authentication
* `/admin` → Admin operations
* `/auctions` → Auction system
* `/matches` → Match handling
* `/games` → Game tracking
* `/fouls` → Foul management
* `/notifications` → Alerts & updates


## Security Features

* Token-based authentication
* Input validation using Zod
* Structured logging for monitoring
* Modular and secure API design


## Advantages

* Scalable monorepo architecture
* Strong type safety with TypeScript
* Reusable API schemas across client and server
* Real-world sports league simulation
* Clean and modular codebase


## Future Enhancements

* Real-time updates using WebSockets
* Advanced analytics dashboard
* Mobile application integration
* AI-powered match predictions
* Leaderboards and ranking system


## Team

* NexPlay

