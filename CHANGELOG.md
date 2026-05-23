# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Combat mode now uses the shared app shell so the menu remains accessible during fights.
- Navigation, card corners, and shadows have been tightened for a less toy-like visual feel.
- Initiative tracker timeline spine now uses a solid accent color for a cleaner projector display.
- Project guidance now clarifies the balance between projector readability and a pleasant desktop setup experience.

### Added

- Settings now include dark mode and wallpaper background toggles.
- SvelteKit project scaffold with TypeScript, Tailwind CSS v4, and Cloudflare Pages adapter
- Design system with warm earthy palette, Lora/Libre Baskerville fonts, diamond wallpaper background, and 6 accent color presets
- Core data types for PartyMember, Enemy, Encounter, Combatant, CombatState, and AppSettings
- Storage adapter abstraction (`storage.ts`) with localStorage implementation
- Constants file with 5e status conditions, accent colors, default settings, and keyboard shortcuts
- Reactive settings store with dynamic accent color application
- App shell with sticky navbar, slide-out sidebar drawer, and file-based routing
- Home/Dashboard page with action cards for Start Combat, Manage Party, and Enemy Library
- Party Library page with full CRUD for player characters (name, AC, HP, level, passive perception)
- Enemy Library page with custom enemy management and encounter template builder
- Initiative Tracker page with vertical timeline layout (history/active/queue zones), round counter, spacebar next-turn, undo support, and keyboard shortcuts
- Idle Screen with slideshow mode cycling through party member cards
- Settings page with toggle switches for display options (player HP, enemy HP/AC, HP format), combat settings, and accent color picker
- CombatantCard component with three visual variants and DM-only data visibility rules
- InitiativeSetup component with two-step flow: combatant selection then rapid initiative entry
- Cloudflare D1 database with schema migration for party members, enemies, encounters, combat state, and settings
- D1 storage adapter with full CRUD operations using batched queries and upserts
- Server-side data loading via SvelteKit load functions and form actions
- API endpoints for combat state (`/api/combat`) and settings (`/api/settings`) persistence
- `wrangler.toml` configuration for Cloudflare Pages + D1 binding
