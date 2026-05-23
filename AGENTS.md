# AGENTS.md — Marching Order

## What This Project Is

A D&D initiative tracker web app designed to be projected on a wall during in-person tabletop sessions. The DM sets up their party and encounters before the game, then uses the tracker during combat to display turn order and status to the whole table.

**Read SPEC.md before doing anything.** It contains the full project specification, data models, scope tiers, and architectural decisions.

## Tech Stack

- SvelteKit + TypeScript + Tailwind CSS
- Cloudflare Pages (via `@sveltejs/adapter-cloudflare`)
- Cloudflare D1 for persistence
- Resend for magic link auth if needed
- Cloudflare R2 for image storage (V2, not yet)

## Project Structure

```
src/
  lib/
    storage.ts          # Storage adapter — ALL persistence goes through here
    types.ts            # Shared TypeScript types (see SPEC.md data model)
    constants.ts        # Status condition list, keyboard shortcuts, defaults
    components/         # Reusable Svelte components
  routes/
    +page.svelte        # Home / Dashboard
    party/              # Party Library
    enemies/            # Enemy Library + Encounter Templates
    tracker/            # Initiative Tracker (core combat screen)
    idle/               # Idle Screen / Slideshow
    settings/           # App Settings
```

## Critical Rules

### Storage Abstraction
Never call D1 directly from components. All data access goes through `src/lib/storage.ts`. This is non-negotiable — it keeps the door open for offline fallback and prevents scattered persistence logic.

### DM-Only vs Public Data
The app is player-facing by default (projected on a wall). Enemy max HP and AC are **never shown** unless the DM explicitly enables them in settings. When rendering combatant data, always check the combatant type and the relevant setting before displaying sensitive fields. See the "DM-Only vs Public Data" section in SPEC.md.

### Projector-First Design
- High contrast, large type, minimal chrome
- Current combatant's name must be readable from 8-10 feet away
- Color encodes meaning (status effects, HP severity, active turn), not decoration
- No busy backgrounds, no gratuitous animations
- Minimum interactive target size: 44×44px

### Speed Above All
- Keyboard binding advances turn. This is the most-used action in the app.
- Encounter template → combat-ready in under 15 seconds
- Full setup (template + initiative entry) in under 60 seconds
- Current turn is always visible without scrolling

## Commit Conventions

All commit messages should be structured as follows as per https://www.conventionalcommits.org/en/v1.0.0/:

<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

The commit contains the following structural elements, to communicate intent to the consumers of your library:

    fix: a commit of the type fix patches a bug in your codebase (this correlates with PATCH in Semantic Versioning).
    feat: a commit of the type feat introduces a new feature to the codebase (this correlates with MINOR in Semantic Versioning).
    BREAKING CHANGE: a commit that has a footer BREAKING CHANGE:, or appends a ! after the type/scope, introduces a breaking API change (correlating with MAJOR in Semantic Versioning). A BREAKING CHANGE can be part of commits of any type.
    types other than fix: and feat: are allowed, for example @commitlint/config-conventional (based on the Angular convention) recommends build:, chore:, ci:, docs:, style:, refactor:, perf:, test:, and others.
    footers other than BREAKING CHANGE: <description> may be provided and follow a convention similar to git trailer format.

Additional types are not mandated by the Conventional Commits specification, and have no implicit effect in Semantic Versioning (unless they include a BREAKING CHANGE). A scope may be provided to a commit’s type, to provide additional contextual information and is contained within parenthesis, e.g., feat(parser): add ability to parse arrays.

## Changelog

This project maintains a `CHANGELOG.md` following [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/). Update it with every change:

- Add entries under `## [Unreleased]` using the appropriate subsection: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, or `Security`.
- Write entries from the user's perspective — describe what changed, not how the code changed internally.
- When a version is released, rename `[Unreleased]` to `[X.Y.Z] - YYYY-MM-DD` and add a fresh empty `[Unreleased]` section above it.

## Working Style

- Ask before assuming if something seems ambiguous or could be interpreted multiple ways.
- Prefer stopping at a clean, presentable state over pushing into half-finished features.
- Don't polish edge cases before the core loop works end-to-end.
- If you're about to build something that affects the URL structure, data model, or storage layer, pause and confirm.
