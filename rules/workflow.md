# Workflow & Specification Decisions

This document defines the official **Staged Dual-Validation Workflow** for this project.

---

## 1. Workflow Overview

```
FDS + Visual Design + Behavior Spec
        │
        ▼
  Plan Mode (read-only)
        │ → outputs features/<id>/plan.md
        ▼
  Developer Approval Gate      ← human reviews plan.md; all specs frozen here
        │
        ▼
  Frontend Build Mode          ← builds UI against mock data (Presentation Contract)
        │ → lint + typecheck after every task (3-attempt self-correction)
        ▼
  UI Review & Freeze           ← human/LLM confirms UI against visual spec
        │ → mock data structures frozen as Presentation Contract
        ▼
  Backend Build Mode           ← implements API to satisfy the Presentation Contract
        │ → lint + typecheck after every task (3-attempt self-correction)
        ▼
  Integration Build Mode       ← replaces frontend mocks with real backend calls
        │ → lint + typecheck after every task (3-attempt self-correction)
        ▼
  Static Quality Gate          ← ESLint + TypeScript typecheck across all workspaces
        │ → fix issues; bounded 3-attempt retry
        ▼
  Testing Build Mode           ← spec-driven test generation (FDS + behavior spec)
        │ → unit, integration, component, and E2E tests
        ▼
  Full Quality Gate            ← all tests pass + coverage threshold verified
        │ → fix issues; bounded 3-attempt retry
        ▼
  Validation                   → Validation Report (ephemeral by default)
```

---

## 2. Phase Definitions

### Phase 1 — Plan Mode (`.ai/prompts/plan-mode.md`)

- **Role**: Read-only specification analyzer and task planner.
- **Input**: `fds.md`, `behavior.md`, `visuals/`, `rules/`
- **Output**: `features/<id>/plan.md`
- **Exit criteria**:
  - Implementation Plan covers all FDS requirements with spec-traced atomic tasks.
  - All known ambiguities at planning time are resolved and documented.
  - Zero conflicts between FDS and `rules/`.

### Phase 2 — Developer Approval Gate

- **Role**: Human review checkpoint after planning, before any code is written.
- **Action**: Developer reviews `features/<id>/plan.md` and either approves or requests changes.
- **On approval**: All specs (`fds.md`, `behavior.md`, `visuals/`) are frozen. No changes permitted without creating a new version and restarting planning.
- **Exit criteria**: Explicit human approval is recorded.

### Phase 3 — Frontend Build Mode (`.ai/prompts/build-mode.md`)

- **Role**: Implements UI components using mock data only. No real backend calls.
- **Rules**:
  - Implements only tasks marked `layer: frontend` in `plan.md`.
  - Uses mock data structures that reflect expected API response shapes.
  - Runs `pnpm lint` + `pnpm typecheck` after every task.
  - 3-attempt self-correction loop per task.
- **Exit criteria**: Lint and typecheck pass. All frontend tasks complete.

### Phase 4 — UI Review & Freeze

- **Role**: Human or LLM visual review of the frontend against the visual spec.
- **Evaluation criteria**: Each acceptance criterion in `visuals/figma.md` must be confirmed as satisfied or explicitly noted as deferred.
- **On freeze**: Frontend visual layout is approved.
- **Exit criteria**: Reviewer explicitly signs off.

### Phase 5 — Backend Build Mode (`.ai/prompts/build-mode.md`)

- **Role**: Implements backend API layers (Presentation → Service → Repository → Database) to satisfy the approved feature specifications.
- **Rules**:
  - Implements only tasks marked `layer: backend` in `plan.md`.
  - Must satisfy all request/response shapes defined in `packages/contracts`.
  - Runs `pnpm lint` + `pnpm typecheck` after every task.
  - 3-attempt self-correction loop per task.
- **Exit criteria**: Lint and typecheck pass. All backend tasks complete.

### Phase 6 — Integration Build Mode (`.ai/prompts/build-mode.md`)

- **Role**: Replaces frontend mock data with real backend API calls via ts-rest client.
- **Rules**:
  - Implements only tasks marked `layer: integration` in `plan.md`.
  - Runs `pnpm lint` + `pnpm typecheck` after every task.
  - 3-attempt self-correction loop per task.
- **Exit criteria**: Lint and typecheck pass. All integration tasks complete. No mock data remaining in production code paths.

### Phase 7 — Static Quality Gate

- **Tool**: `pnpm lint` (ESLint) + `pnpm typecheck` (`tsc --noEmit`).
- **What it checks**: Code style, syntax, TypeScript typing, unused variables across all packages.
- **Rules**:
  - Fix all errors and warnings before advancing.
  - 3-attempt retry limit. On persistent failure, stop and escalate.
- **Exit criteria**: `pnpm lint` and `pnpm typecheck` pass with zero errors.

### Phase 8 — Testing Build Mode (`.ai/prompts/test-build-mode.md`)

- **Role**: Spec-driven, post-implementation test generation.
- **Input**: Frozen FDS (`fds.md`), Behavior Spec (`behavior.md`), integrated source code.
- **Rules**:
  - Primary context is the specification, not the implementation.
  - Generates unit, integration, component, and E2E tests that validate behavior against the FDS.
  - **MUST NOT modify production source code** unless a genuine defect is found.
  - Defect classification required: `defect` (return to Backend/Integration Build) vs `bad-test` (rewrite the test).
  - Human escalation if classification is uncertain.
- **Exit criteria**: All tests pass. Coverage meets the threshold declared in `fds.md` frontmatter.

### Phase 9 — Full Quality Gate

- **Tool**: `pnpm test` (Vitest) + `pnpm test:e2e` (Playwright) + `pnpm test:coverage`.
- **What it checks**: Unit, integration, component, E2E test passes + line/branch coverage against `coverage_target`.
- **Rules**:
  - Coverage threshold: as declared in `fds.md` frontmatter (default: >80% line coverage).
  - 3-attempt retry limit. On persistent failure, stop and escalate.
- **Exit criteria**: All automated tests pass and coverage threshold is met.

### Phase 10 — Validation Report

- **Role**: Final compliance matrix confirming every acceptance criterion is satisfied.
- **Output**: `features/<id>/validation-report.md`
- **Persistence**: Ephemeral by default. Mark as persistent in `fds.md` frontmatter for compliance-relevant features.
- **Exit criteria**: All acceptance criteria checked. Report complete.

---

## 3. Rollback Decision Tree

If any phase fails and cannot be resolved in-place within its retry limit:

```
Test failure (Testing Build)
  ├─ Defect in production code?        → return to Phase 5 (Backend) or Phase 6 (Integration)
  ├─ Contract mismatch discovered?     → return to Phase 4 (UI Review & Freeze); renegotiate contract
  ├─ FDS ambiguity surfaced?           → unfreeze specs; create new FDS version; restart Phase 1
  └─ Bad test (not a defect)?          → rewrite test; stay in Phase 8

Static/Full Quality Gate failure
  ├─ Code smell / typing error?        → fix in-place (stay in current phase)
  └─ Architectural violation?          → return to Phase 5 (Backend Build)

Backend Build failure
  ├─ Contract incompatible?            → attempt in-place resolution first
  └─ Fundamental contract breach?      → return to Phase 4 (UI Review & Freeze)

Frontend Build failure
  └─ Spec conflict?                    → stop; report to Developer Approval Gate
```

---

## 4. Change Classification (Frozen Spec Amendments)

When a gap or conflict is discovered in the frozen specs during implementation:

| Class             | Definition                                                 | Response                                                  |
| :---------------- | :--------------------------------------------------------- | :-------------------------------------------------------- |
| **Clarification** | Gap always implied by the FDS, just not written explicitly | Document an addendum in-place; no restart required        |
| **Extension**     | New requirement not implied by the FDS                     | New FDS version; restart from Phase 1                     |
| **Contradiction** | Implementation reveals the FDS is internally inconsistent  | New FDS version; restart from Phase 1; stakeholder review |

---

## 5. Feature Classification Rubric

Before choosing the workflow depth for a feature, classify it:

| Axis                          | Score 0                          | Score 1                       | Score 2                                  |
| :---------------------------- | :------------------------------- | :---------------------------- | :--------------------------------------- |
| **Specification stability**   | Requirements expected to change  | Requirements mostly stable    | Fully locked and approved                |
| **UI/API surface complexity** | Single component, no API changes | Multi-component, existing API | New multi-step UI with new API contracts |
| **Team/agent separation**     | Single developer or agent        | Two, loosely coordinated      | Dedicated frontend + backend roles       |

- **Score 0–2**: Use simplified two-mode flow (inline tests, no staged phases).
- **Score 3–4**: Hybrid — adopt Approval Gate + contracts package; keep per-task testing.
- **Score 5–6**: Use full Staged Dual-Validation flow.

---

## 6. Living Specification Standards (`features/<feature-id>/`)

```
features/<feature-id>/
├── fds.md                    # Feature Design Specification (YAML frontmatter + requirements)
├── behavior.md               # Interaction & Behavioral Specification
├── plan.md                   # Implementation Plan (generated in Plan Mode; frozen after approval)
├── validation-report.md      # Validation Report (generated after Code Validation 2)
└── visuals/                  # Visual design specs (figma.md, screenshots)
```

### FDS Frontmatter Requirements

All `fds.md` files MUST declare:

- `id`: Feature identifier (kebab-case)
- `title`: Human-readable feature name
- `status`: `active` | `draft` | `archived`
- `version`: SemVer string (e.g., `1.0.0`)
- `owner`: Team or feature owner
- `last_updated`: YYYY-MM-DD date
- `coverage_target`: Minimum line coverage % (e.g., `80`) — used by Phase 9
- `compliance_relevant`: `true` | `false` — determines if Validation Report is persistent
- `dependencies`: List of dependent features with minimum versions
- `changelog`: List of version history entries

---

## 7. Quality Gate Standards

| Quality Gate            | Used In | Requirements                                                                        |
| :---------------------- | :------ | :---------------------------------------------------------------------------------- |
| **Static Quality Gate** | Phase 7 | `pnpm lint` (ESLint) + `pnpm typecheck` (`tsc --noEmit`) pass across all workspaces |
| **Full Quality Gate**   | Phase 9 | `pnpm test` + `pnpm test:e2e` pass + line coverage meets `coverage_target` in FDS   |

---

## 8. Bounded Retry Policy

All self-correction loops are bounded at **3 attempts** per task or gate. Beyond 3 attempts, stop and escalate. Do not continue retrying — LLM output oscillates and degrades beyond 3 attempts.
