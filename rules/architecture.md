# Architecture

This document defines the architectural rules of the project.

These rules are mandatory.

---

# Architectural Style

The system consists of two independent applications.

- Frontend Application
- Backend API

The frontend communicates with the backend exclusively through HTTP APIs defined using ts-rest contracts.

Business logic must remain entirely within the backend.

---

# Backend Layers

Presentation
↓

Service
↓

Repository
↓

Database

---

## Presentation Layer

Responsibilities

- Receive HTTP requests.
- Validate incoming requests.
- Invoke application services.
- Return HTTP responses.

Rules

- MUST NOT contain business logic.
- MUST NOT access the database directly.
- MUST remain thin.

---

## Service Layer

Responsibilities

- Implement business rules.
- Coordinate workflows.
- Enforce domain constraints.

Rules

- Owns all business logic.
- MUST remain independent of Express.
- MUST NOT depend on HTTP request or response objects.
- MUST communicate with persistence only through repositories.

---

## Repository Layer

Responsibilities

- Persist and retrieve data.
- Encapsulate Drizzle ORM usage.

Rules

- Database access occurs exclusively here.
- MUST NOT contain business rules.
- MUST expose intention-revealing methods.

---

# Dependency Rules

Allowed

Presentation → Service

Service → Repository

Repository → Database

Forbidden

Presentation → Repository

Presentation → Database

Repository → Service

Repository → Presentation

Service → HTTP

---

# Frontend Architecture

The frontend is responsible only for user interaction.

Business rules belong to the backend.

The frontend communicates exclusively through ts-rest clients.

UI components MUST NOT contain business rules.

Pages compose reusable components.

Components remain presentation-focused.

---

# Backend Responsibilities

The backend owns

- Business rules
- Validation
- Authorization (when introduced)
- Data persistence
- Email delivery
- Campaign processing
- Placeholder resolution

---

# API Contracts

The API contract is the source of truth between the frontend and backend.

Routes, request schemas, response schemas, and inferred client types MUST originate from the shared ts-rest contract.

## The frontend and backend MUST NOT define duplicate request or response types independently.

# Frontend Responsibilities

The frontend owns

- Rendering
- Navigation
- User interaction
- Form state
- Client-side validation
- API communication

---

# API Design

All API contracts are defined using ts-rest.

The frontend MUST consume backend APIs through generated ts-rest clients.

Business entities are exposed through RESTful resources.

---

# Validation

Client-side validation improves user experience.

Server-side validation is authoritative.

Incoming API requests MUST be validated before entering the Service Layer.

---

# State Management

Server state is managed using TanStack Query.

Local UI state remains local whenever possible.

Avoid unnecessary global state.

---

# Database Access

Only repositories may access the database.

Services MUST NOT execute ORM operations directly.

---

# Error Handling

Services produce domain errors.

Presentation translates domain errors into HTTP responses.

Frontend translates HTTP responses into user-facing feedback.

---

# Transactions

Services define transactional intent.

Repositories execute transactional operations.

---

# Separation of Concerns

Frontend concerns

↓

API communication

↓

Business rules

↓

Persistence

must remain isolated.

---

# Forbidden Practices

Do not place business logic in Express route handlers.

Do not access the database outside repositories.

Do not bypass ts-rest contracts.

Do not call the database from the frontend.

Do not duplicate business rules between frontend and backend.

Do not expose ORM models directly to API consumers.

Do not couple business logic to Express.

Do not create circular dependencies.
