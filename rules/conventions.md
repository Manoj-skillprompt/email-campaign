# Coding Conventions

This document defines coding standards for the project.

Consistency is preferred over personal preference.

---

# General Principles

- Prioritize readability over cleverness.
- Prefer explicit code over implicit behavior.
- Keep implementations simple.
- Avoid unnecessary abstractions.
- Follow existing project patterns before introducing new ones.

---

# Naming

## Files

Use kebab-case.

Example

contact-service.ts

campaign-repository.ts

---

## Components

Use PascalCase.

Example

ContactTable

CampaignForm

---

## Functions

Use camelCase.

Function names should describe intent.

Good

createCampaign()

findByEmail()

scheduleCampaign()

Avoid

handle()

process()

execute()

---

## Variables

Use descriptive names.

Avoid abbreviations unless universally understood.

---

# Functions

Functions should perform one responsibility.

Prefer small, focused functions.

Avoid deeply nested logic.

Prefer early returns.

Avoid excessive parameters.

---

# Components

Components should focus on presentation.

Extract repeated UI into reusable components.

Avoid large components.

---

# Services

One service should represent one business capability.

Services should expose intention-revealing methods.

Avoid utility-style service classes.

---

# Repositories

Repositories expose persistence operations only.

Keep repository interfaces small.

Avoid generic repositories.

Prefer feature-specific repositories.

---

# Imports

Import order

1. External packages

2. Internal modules

3. Relative imports

Remove unused imports.

Avoid circular imports.

---

# Error Handling

Throw meaningful errors.

Avoid silent failures.

Avoid generic error messages.

Include actionable information where appropriate.

---

# Comments

Code should explain itself whenever possible.

Comments should explain "why", not "what".

Remove outdated comments.

Do not leave commented-out code.

---

# Formatting

Use the project's formatter.

Do not manually fight formatting rules.

Maintain consistent spacing and line length.

---

# Duplication

Avoid duplicated logic.

Extract shared behaviour only after duplication becomes evident.

Do not create abstractions prematurely.

---

# Constants

Avoid magic numbers and hardcoded strings.

Use named constants where appropriate.

---

# Boolean Logic

Prefer positive condition names.

Avoid double negatives.

Keep conditionals simple.

---

# Async Code

Prefer async/await.

Avoid deeply nested promise chains.

Handle expected failures explicitly.

---

# TypeScript

Prefer explicit types for public interfaces.

Avoid using any.

Model domain concepts with appropriate types.

Use readonly where mutation is not intended.

---

# Testing

Write tests for business behaviour.

Test observable outcomes.

Avoid testing implementation details.

Keep tests independent.

---

# Git

Keep changes focused.

One logical change per commit.

Write meaningful commit messages.

---

# Maintainability

Leave the codebase in a better state than you found it.

When introducing new code, follow existing architectural patterns.
