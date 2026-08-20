# Email Campaign V2 — AI Agent Guide

This project uses the **Staged Dual-Validation Workflow**. All AI agents must read this file first before doing anything.

---

## Workflow Phases & Which Prompt to Use

| Phase                           | When                          | System Prompt                                                        |
| :------------------------------ | :---------------------------- | :------------------------------------------------------------------- |
| **1 — Plan Mode**               | Before any code is written    | `.ai/prompts/plan-mode.md`                                           |
| **2 — Developer Approval Gate** | After plan.md is generated    | Human reviews & approves plan.md                                     |
| **3–5 — Build Mode**            | After approval; provide PHASE | `.ai/prompts/build-mode.md` + `PHASE=Frontend\|Backend\|Integration` |
| **4 — UI Review & Freeze**      | After Frontend phase          | Human approves visual layout at http://localhost:3000                |
| **5 — Backend Build Mode**      | After UI Review & Freeze      | `.ai/prompts/build-mode.md` + `Phase = Backend`                      |
| **6 — Integration Build Mode**  | After Backend phase           | `.ai/prompts/build-mode.md` + `Phase = Integration`                  |
| **7 — Test Build Mode**         | After Integration phase       | `.ai/prompts/test-build-mode.md`                                     |
| **8 — Validation Mode**         | After all tests pass          | `.ai/prompts/validation-prompt.md`                                   |

---

## How to Invoke Each Mode

### Plan Mode

```
System prompt : .ai/prompts/plan-mode.md
User message  : Feature ID = <feature>
```

### Build Mode

```
System prompt : .ai/prompts/build-mode.md
User message  : Feature ID = <feature>
                Phase = Frontend   ← or Backend, or Integration
```

### Test Build Mode

```
System prompt : .ai/prompts/test-build-mode.md
User message  : Feature = <feature>
```

### Validation Mode

```
System prompt : .ai/prompts/validation-prompt.md
User message  : Feature = <feature>
```

---

## Project Rules (read before any task)

| Rule File               | Contents                                                    |
| :---------------------- | :---------------------------------------------------------- |
| `rules/workflow.md`     | Full 10-phase workflow with rollback decision tree          |
| `rules/architecture.md` | Layer rules: Presentation → Service → Repository → Database |
| `rules/conventions.md`  | Naming, formatting, function design                         |
| `rules/tech-stack.md`   | Approved libraries and frameworks only                      |

---

## Feature Specs Location

```
features/
└── <feature-id>/
    ├── fds.md                   # Feature Design Specification (source of truth)
    ├── behavior.md              # Interaction & behavioral spec
    ├── plan.md                  # Implementation Plan (generated in Plan Mode)
    ├── validation-report.md     # Generated in Validation Mode
    └── visuals/
        └── figma.md             # Figma design reference
```

### Active Features

| Feature    | FDS                        | Status                      |
| :--------- | :------------------------- | :-------------------------- |
| `contacts` | `features/contacts/fds.md` | active — awaiting Plan Mode |

---

## Key Constraints

- **Never modify** `fds.md`, `behavior.md`, `figma.md`, `plan.md`, or `rules/` during Build or Test modes.
- **Bounded retry**: max 3 attempts per task, max 5 attempts for full suite fixes.
- **No new libraries** without explicit approval.
- **No production code changes** in Test Build Mode unless a defect is formally documented.
- All API contracts go through `packages/contracts/src/` via ts-rest — never defined inline.
