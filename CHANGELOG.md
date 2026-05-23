# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Add Player, Add Enemy, and Add Encounter fields now support type-to-search suggestions with Tab completion that cycles through the visible recommendations.
- Debug seed button (dice icon) in the navbar — seeds a default party and enemy roster for quick testing.

### Changed

- Add Player, Add Enemy, and Add Encounter now share the same full-width field style with a fixed four-row recommendation area.
- Initiative entry now uses each combatant's marker color as a border accent instead of a full colored card fill.
- Combat display defaults now use larger corner markers and a slower turn transition without exposing the old tweaks panel.
- Accent color is now fixed to charcoal (`#3E3E3E`) — per-session and per-settings color customization has been removed.
- Navigation bar reverts to its original warm brown (`#2F2922` light / `#17130F` dark).
- Initiative progress dots now reflect each combatant's marker color.

### Fixed

- Add Player and Add Enemy dropdown lists now keep readable text in dark mode.
- Initiative entry keeps focus in the roll field after using the mouse to advance.
- E2E tests now clean up party members after each run; test-generated roster entries no longer persist across dev server sessions.

### Removed

- Combat display tweaks panel from the tracker screen.
- "Show Player HP" display toggle — player hit points are no longer shown on the tracker or idle screen.
- "HP Reset on New Combat" setting from the Combat section.
- Theme Color selector from the Settings page.
- Accent color picker from the combat Tweaks panel.

### Changed

- Combat mode now keeps the current turn locked inside the visible viewport while history and queue entries stay constrained around it.
- Combatant corner markers now use balanced triangular corner pockets instead of long narrow wedges.
- Active combatant cards now use theme-aware colors so names remain readable in dark mode.
- The combat navbar now includes a quick light/dark mode toggle for changing table visibility mid-session.
- The combat tweaks panel now adjusts accent color and combat card corner size for faster visual exploration.
- Combatant rename controls now use a compact pencil icon instead of text.
- Add player/enemy chooser controls now use a drawn dropdown chevron instead of text.
- Combat setup rows now support renaming combatants and assigning colored markers before initiative starts.
- Combat cards now use a neutral active fill with colored corner markers to keep names and status effects readable.
- Initiative entry now uses a plain numeric text field without browser stepper arrows.
- The add enemy dialog now separates single-enemy and encounter-template setup behind an Enemy/Encounter toggle.
- Combat setup masthead spacing is tighter for projector readability.
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

### Removed

- Removed the redundant Start Combat button from the top navigation.

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
