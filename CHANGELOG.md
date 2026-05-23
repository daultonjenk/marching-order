# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
