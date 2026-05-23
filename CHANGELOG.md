# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Opening Marching Order now lands directly on combat setup instead of a separate dashboard page.
- The previous `/tracker` combat URL now redirects to the main combat screen at `/`.
- Combat setup now has a more prominent first-screen masthead with lineup counts and the initiative action.
- Combat setup now uses separate player and enemy columns with focused add dialogs and stable lineups.
- Party management is now framed as a name-first roster, with character details tucked behind optional display details.
- Roster profile fields are now truly optional instead of using placeholder stat values.
- Menu navigation now surfaces the non-combat slideshow as a first-class table display mode.
- Player HP and AC now default to hidden on initiative and idle screens.
- Combat mode now uses the shared app shell so the menu remains accessible during fights.
- Navigation, card corners, and shadows have been tightened for a less toy-like visual feel.
- Initiative tracker timeline spine now uses a solid accent color for a cleaner projector display.
- Project guidance now clarifies the balance between projector readability and a pleasant desktop setup experience.

### Fixed

- The tracker now keeps recent past turns visible when initiative wraps into a new round.
- Enemy HP, HP severity, and AC are no longer shown on read-only screens when their display settings are disabled.

### Added

- Combat setup now has an always-available quick add for combat-only player and enemy names.
- Settings now include a toggle for showing player AC.
- Playwright end-to-end coverage for turn history and enemy stat visibility.
- Settings now include dark mode and wallpaper background toggles.
- SvelteKit project scaffold with TypeScript, Tailwind CSS v4, and Cloudflare Pages adapter
- Design system with warm earthy palette, Lora/Libre Baskerville fonts, diamond wallpaper background, and 6 accent color presets
- Core data types for PartyMember, Enemy, Encounter, Combatant, CombatState, and AppSettings
- Storage adapter abstraction (`storage.ts`) with localStorage implementation
- Constants file with 5e status conditions, accent colors, default settings, and keyboard shortcuts
- Reactive settings store with dynamic accent color application
- App shell with sticky navbar, slide-out sidebar drawer, and file-based routing
- Combat setup landing screen with direct access to initiative tracking
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
