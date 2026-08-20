# Feature Implementation Playbook

This document is the step-by-step operational guide for developing any feature (`[[FEATURE]]`) under the **Staged Dual-Validation Workflow**.

Replace `[[FEATURE]]` with the actual feature name (e.g. `contacts`, `groups`, `campaigns`).

---

## Workflow Lifecycle at a Glance

```
1. Plan Mode ───────────► 2. Developer Approval Gate (Commit Plan)
                                 │
                                 ▼
3. Frontend Build ──────► 4. UI Review & Freeze (Commit Frontend)
                                 │
                                 ▼
5. Backend Build ───────► (Commit Backend)
                                 │
                                 ▼
6. Integration Build ───► (Commit Integration)
                                 │
                                 ▼
7. Test Build ──────────► (Commit Tests & Fixes)
                                 │
                                 ▼
8. Validation Mode ─────► (Commit Validation Report)
```

---

## Phase 1: Plan Mode (Read-Only Planning)

### Claude Code Prompt

- **System Prompt**:
  ```text
  Read the file .ai/prompts/plan-mode.md and follow it exactly. That is your system prompt.
  ```
- **User Message**:
  ```text
  Feature ID = [[FEATURE]]
  ```

### What Happens:

- Agent inspects `features/[[FEATURE]]/fds.md`, `behavior.md`, `figma.md`, and `rules/`.
- Detects scenario (A: New Standalone, B: Spec Update, C: Cross-Feature Dependency).
- Generates `features/[[FEATURE]]/plan.md`.

---

## Phase 2: Developer Approval Gate

### Action:

1. Review `features/[[FEATURE]]/plan.md`.
2. Ensure task breakdown, layering, and test tasks are complete and accurate.

### Commit:

```bash
git add -A && git commit -m "docs([[FEATURE]]): add approved implementation plan"
```

---

## Phase 3: Frontend Build Mode (Mock UI)

### Claude Code Prompt

- **System Prompt**:
  ```text
  Read the file .ai/prompts/build-mode.md and follow it exactly. That is your system prompt.
  ```
- **User Message**:
  ```text
  Feature ID = [[FEATURE]]
  Phase = Frontend
  ```

### What Happens:

- Agent builds frontend UI matching Figma specs using mock data.
- Generates draft `features/[[FEATURE]]/presentation-contract.md`.

---

## Phase 4: UI Review & Freeze

### Action:

1. Run `pnpm dev` and visit `http://localhost:3000/[[FEATURE]]`.
2. Verify visual layout, modals, empty states, and forms.
3. Review `features/[[FEATURE]]/presentation-contract.md`.

### Commit:

```bash
pnpm format
git add -A && git commit -m "feat([[FEATURE]]): frontend build complete and presentation contract frozen"
```

---

## Phase 5: Backend Build Mode

### Claude Code Prompt

- **System Prompt**:
  ```text
  Read the file .ai/prompts/build-mode.md and follow it exactly. That is your system prompt.
  ```
- **User Message**:
  ```text
  Feature ID = [[FEATURE]]
  Phase = Backend
  ```

### What Happens:

- Agent implements `packages/contracts`, Drizzle DB schema/join tables, Repository, Service, and Express Router to satisfy the frozen `presentation-contract.md`.

### Commit:

```bash
pnpm format
git add -A && git commit -m "feat([[FEATURE]]): backend build complete"
```

---

## Phase 6: Integration Build Mode

### Claude Code Prompt

- **System Prompt**:
  ```text
  Read the file .ai/prompts/build-mode.md and follow it exactly. That is your system prompt.
  ```
- **User Message**:
  ```text
  Feature ID = [[FEATURE]]
  Phase = Integration
  ```

### What Happens:

- Agent connects frontend to real backend API via TanStack Query and `ts-rest` client.
- Wires form submission, mutations, and error mappings.
- Completely deletes mock data files from production paths.

### Commit:

```bash
pnpm format
git add -A && git commit -m "feat([[FEATURE]]): integration build complete"
```

---

## Phase 7: Test Build Mode (Spec-Driven Testing)

### Claude Code Prompt

- **System Prompt**:
  ```text
  Read the file .ai/prompts/test-build-mode.md and follow it exactly. That is your system prompt.
  ```
- **User Message**:
  ```text
  Feature = [[FEATURE]]
  ```

### What Happens:

- Agent writes all Unit, API Integration, Component, E2E, and Regression tests listed in `plan.md`.
- Fixes genuine production defects if surfaced by spec tests (documented as notes).

### Commit:

```bash
pnpm format
git add -A && git commit -m "test([[FEATURE]]): test build complete"
```

---

## Phase 8: Validation Mode (Final Audit)

### Claude Code Prompt

- **System Prompt**:
  ```text
  Read the file .ai/prompts/validation-prompt.md and follow it exactly. That is your system prompt.
  ```
- **User Message**:
  ```text
  Feature = [[FEATURE]]
  ```

### What Happens:

- Agent runs all tests, verifies FDS criteria, checks architecture compliance, and produces `features/[[FEATURE]]/validation-report.md`.

### Commit:

```bash
pnpm format
git add -A && git commit -m "docs([[FEATURE]]): add final validation report"
```
