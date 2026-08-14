# Technology Stack

This document defines the technologies used throughout the project.

All implementations must adhere to these selections unless explicitly approved otherwise.

---

# Frontend

## Framework

- Next.js

## Rendering

- Client-Side Rendering (CSR)

## Language

- TypeScript

## UI

- React
- Tailwind CSS
- shadcn/ui

## Forms & Validation

- React Hook Form
- Zod

## Data Fetching

- TanStack Query

## API Communication

- ts-rest Client

---

# Backend

## Framework

- Express.js

## Language

- TypeScript

## API Contract

- ts-rest

## Business Logic

- Service Layer

## Validation

- Zod

---

# Database

## ORM

- Drizzle ORM

## Database

- SQLite (`sqlite3` driver)

---

# Email

- Amazon SES

---

# Package Manager

- pnpm

---

# Code Quality

- ESLint
- Prettier

---

# Testing

## Unit Testing

- Vitest

## End-to-End Testing

- Playwright

---

# Containerization & Deployment

- Docker (Multi-stage build using Node 22 Alpine)
- Docker Compose (`docker-compose.yml`)

---

# Principles

- End-to-end TypeScript
- Separate frontend and backend repositories
- RESTful API using Express.js
- API contracts defined with ts-rest
- Client-side rendered frontend
- Server-side business logic
- Database access exclusively through Drizzle ORM
- Component-based UI
- Responsive design
