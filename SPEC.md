# Marching Order — Project Specification

## Overview

Marching Order is a D&D initiative tracker designed for in-person tabletop play. It runs as a static web app projected onto a wall so the entire table can see turn order, status effects, and player info at a glance. The app is player-facing by default — it does not show enemy HP or AC unless the DM explicitly enables it in settings.

The core value proposition is **speed**. Any downtime in D&D breaks immersion. This app must get from "roll initiative!" to active tracking in under 60 seconds with a pre-built encounter, and advancing turns must be a single keypress.

---

## Tech Stack

- **Framework:** SvelteKit (with `@sveltejs/adapter-cloudflare`)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Cloudflare Pages
- **Database:** Cloudflare D1 (SQLite at the edge)
- **Auth:** Magic link email via Resend
- **Image Storage:** Cloudflare R2 (for portraits in V2)
- **SRD Data:** Bundled as a lazy-loaded JSON file at build time (not fetched at runtime)

### Why This Stack

- **SvelteKit over React/Vue:** Compiles to vanilla JS with no runtime (~0KB framework overhead vs React's ~40KB). Built-in transitions/animations. File-based routing maps cleanly to the app's screen structure. Native Cloudflare Pages adapter. Lighter bundle = faster load on the DM's "oh crap, combat is starting" mid-session open.
- **D1 over localStorage:** Daulton's $5/mo Cloudflare Workers Paid plan includes 5GB D1 storage and 25 billion row reads/month. A full user profile is ~10KB. This supports 500,000+ users before storage is a concern, and millions of operations before hitting rate limits. Starting with D1 avoids a future localStorage→cloud migration. Resend is already set up for auth.
- **R2 for portraits (V2):** 10GB free on the paid plan. 300-400 compressed images at 1024×1024 JPEG (~200-400KB each) uses ~1-2% of the free allowance.

---

## URL Structure

Locked early because SvelteKit's file-based routing makes URLs architectural. Changing these later breaks bookmarks and future QR join URLs.

```
/              → Home / Dashboard
/party         → Party Library (manage player characters)
/enemies       → Enemy Library (custom enemies + encounter templates)
/tracker       → Initiative Tracker (the core combat screen)
/idle          → Idle Screen / Slideshow Mode
/settings      → App Settings
```

---

## Data Model

### Storage Layer Abstraction

All data access goes through a `storage.ts` adapter module. Components never call D1 directly. This keeps the door open for offline/localStorage fallback later if needed.

```typescript
// Conceptual interface — not final implementation
interface StorageAdapter {
  // Party
  getParty(): Promise<PartyMember[]>
  savePartyMember(member: PartyMember): Promise<void>
  deletePartyMember(id: string): Promise<void>

  // Enemies
  getCustomEnemies(): Promise<Enemy[]>
  saveCustomEnemy(enemy: Enemy): Promise<void>
  deleteCustomEnemy(id: string): Promise<void>

  // Encounters
  getEncounters(): Promise<Encounter[]>
  saveEncounter(encounter: Encounter): Promise<void>
  deleteEncounter(id: string): Promise<void>

  // Combat State
  getCombatState(): Promise<CombatState | null>
  saveCombatState(state: CombatState): Promise<void>
  clearCombatState(): Promise<void>
}
```

### Core Types

```typescript
interface PartyMember {
  id: string
  name: string
  ac?: number
  maxHp?: number
  currentHp?: number
  level?: number
  passivePerception?: number
  portraitUrl?: string        // V2 — URL to R2-stored image
  // No class, no ability scores, no spell lists.
  // Name is the only required roster field; display details are optional.
}

interface Enemy {
  id: string
  name: string
  maxHp: number
  ac: number
  abilities?: string          // Short text, e.g., "Pack Tactics, Nimble Escape"
  source: 'custom' | 'srd'
  srdSlug?: string            // Reference back to SRD data if sourced from there
}

interface Encounter {
  id: string
  name: string                // e.g., "Goblin Ambush"
  entries: EncounterEntry[]
  notes?: string              // e.g., "Bugbear is hiding, surprise round"
}

interface EncounterEntry {
  enemyId: string
  quantity: number
}

interface Combatant {
  id: string                  // Unique per-combat instance
  name: string                // Display name, e.g., "Goblin 1", "Goblin 2"
  type: 'player' | 'enemy'
  initiative: number
  currentHp: number
  maxHp: number
  ac: number
  level?: number              // Players only
  passivePerception?: number  // Players only
  statuses: StatusCondition[]
  isDown: boolean             // true when HP reaches 0
  isDead: boolean             // manually toggled by DM (enemies)
  portraitUrl?: string
}

interface StatusCondition {
  id: string
  label: string               // "Prone", "Hasted", "Custom: On Fire"
  isCustom: boolean
  roundDuration: number
}

interface CombatState {
  combatants: Combatant[]
  currentTurnIndex: number
  round: number
  history: TurnHistoryEntry[] // For undo support
}

interface TurnHistoryEntry {
  turnIndex: number
  round: number
  snapshot: Combatant[]       // Full state snapshot for undo
}
```

### DM-Only vs Public Data

Even though V1 is single-view and player-facing, the data model separates what's safe to display from what's DM-only. This prevents a painful refactor when the V3 player view / QR join feature lands.

**Always visible (player-facing):**
- Combatant name
- Player current/max HP (if HP display enabled in settings)
- Status conditions
- Turn order position
- Player AC, level

**DM-only (hidden by default, togglable in settings):**
- Enemy max HP
- Enemy AC
- Enemy current HP (shown as nothing, or optionally as a severity color: green/yellow/red)
- Encounter notes

---

## Screens

### Home / Dashboard

Three clear paths: Start Combat, Manage Party, Enemy Library. No widgets, no stats. If no party exists, nudge toward Manage Party.

### Party Library

CRUD interface for player characters. Fields: name, AC, max HP, level, passive perception. Portrait placeholder for V1 (initials or generic icon), uploadable image in V2.

### Enemy Library

Two sections:

1. **Custom Enemies** — DM-created. Fields: name, max HP, AC, key abilities (optional short text).
2. **Encounter Templates** — saved groups of enemies with quantities. One-tap load into the initiative tracker. The UX for finding the right encounter mid-session needs to feel fast — consider search, favorites, or a "recent" section. Exact approach TBD after we feel the friction in practice.

**SRD Monster Database (V1.5):** Searchable list of official D&D SRD 5.1/5.2 monsters bundled at build time. Lazy-loaded, not in the main JS bundle. The DM searches, finds a monster, and either adds it directly to an encounter or copies it to Custom Enemies with optional edits. For initiative tracking purposes, surface: name, HP, AC, CR, and notable traits. CC-BY-4.0 attribution required (footer or credits page).

### Initiative Tracker (Combat View)

The core screen. 90% of in-session time is spent here.

#### Layout: Vertical Timeline

A vertical list along a central spine, ordered by initiative (highest first). Three zones:

- **History zone (top):** 1-2 entries, visually dimmed/smaller. Shows who just went. Scrolls off naturally.
- **Active zone (center):** Current combatant's turn. Visually dominant — larger card, accent border/background, subtle pulse or glow. This is where every eye in the room goes.
- **Queue zone (below):** Upcoming turns in order. Normal size. Players see when their turn is coming.

The current turn should always be visible without scrolling.

#### Per-Combatant Display

**Players:** Name (large), HP current/max (if enabled), AC (shield icon + number), status effect tags (colored), level (small/secondary).

**Enemies:** Name (large, auto-numbered: "Goblin 1", "Goblin 2"), status effect tags. No HP, no AC, no max HP by default. DM can enable enemy HP/AC display in settings.

#### 0 HP Behavior

- **Players:** Marked as "Downed" — visually distinct (greyed, red indicator, fallen icon). Remain in turn order for death saving throws.
- **Enemies:** DM gets a primary action (skull icon = dead, removed/greyed in tracker) with a dropdown for alternatives: "Unconscious", "Dead (remove from order)", etc. Could have a satisfying KO animation for the kill — keep it snappy, not flashy.

#### Combat Setup Flow

1. Party auto-loads from Party Library (DM chooses: preserve current HP from last combat, or reset all to max).
2. Add enemies: tap a saved Encounter Template (one tap, all enemies added) OR manually add from Enemy Library.
3. **Rapid Initiative Entry:** A focused flow where the app shows each combatant name one at a time with a number input. DM calls out the name, player calls out their roll, DM types the number and hits Enter/Tab to advance. Like a cashier scanning items. For enemies, optional "roll for enemies" button (d20 + DEX mod auto-roll) is a nice-to-have.
4. Auto-sort by initiative (descending). Ties resolved by manual drag or DM choice.
5. "Begin Combat" transitions to the active tracker view.

**Target: 30-60 seconds** for a typical encounter (4-5 PCs + 4-6 enemies) with a pre-built encounter template.

#### DM Controls

- **Next Turn (Spacebar):** Advances to the next combatant. Most prominent control.
- **Previous Turn (Shift+Space or Backspace):** Undo — go back one turn. Restores previous state from history snapshot.
- **Add Combatant:** Mid-combat addition (reinforcements, summons).
- **Remove Combatant:** Death or flee.
- **Toggle Status:** Tap a combatant, pick from status condition list or type custom.
- **Round Counter:** Auto-increments when turn order cycles back to the top.
- **End Combat:** Exits tracker, optionally preserves player HP state.

#### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Next turn |
| Shift+Space or Backspace | Previous turn (undo) |
| Escape | Cancel current action / close modal |
| A | Add combatant |
| S | Toggle status on selected combatant |

Additional shortcuts TBD based on what feels right in practice.

#### Status Conditions (V1 Preset List)

Official 5e conditions: Blinded, Charmed, Deafened, Frightened, Grappled, Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned, Unconscious.

Plus a "Custom" option where the DM types a label (e.g., "Hasted", "Concentrating", "On Fire").

**V1: Presence/absence only.** The DM manually adds and removes conditions.

**V2: Duration tracking.** Conditions track how many turns they've been active and auto-prompt for removal. This requires tracking whose turn-start or turn-end triggers removal — non-trivial but very valuable. The undo system must also correctly restore/remove conditions when stepping backward through turns.

### Idle Screen / Slideshow Mode

Non-combat display that cycles through player character cards on the projector. Keeps the display useful and atmospheric between combats instead of showing the DM's desktop.

Each slide: character name (large), portrait (placeholder V1, image V2), class & level, AC, HP, optional flavor text/description (DM-entered).

Auto-advances on a configurable timer (default 8-12 seconds). Simple transitions (fade or slide). Data pulls from Party Library — no extra setup required.

### Settings

A dedicated settings screen for app-wide configuration:

- **Display: Light / Dark mode** (dark mode likely better for projector environments)
- **Display: Show player HP** (on/off, default on)
- **Display: Show enemy HP** (on/off, default off)
- **Display: Show enemy AC** (on/off, default off)
- **Display: Enemy HP format** (exact number / severity color only — green/yellow/red)
- **Idle Screen: Slide duration** (seconds)
- **Idle Screen: Transition style** (fade / slide)
- **Combat: Auto-roll enemy initiative** (on/off)
- **Combat: HP reset behavior on new combat** (reset to max / preserve current)

Settings persist to D1 alongside user data.

---

## Design Principles

### Projector-First

This app is designed to be projected onto a wall via a cheap projector. Every design decision filters through this:

- High contrast (near-black on near-white or vice versa). No mid-tones.
- Large type. Current combatant's name readable from 8-10 feet on 720p.
- Minimal chrome. Borders, shadows, and ornament only for structural clarity.
- No busy backgrounds. Solid or near-solid only.
- Color as signal: HP severity (green → yellow → red), status effects, current turn highlight. Not decoration.
- Minimum target size for interactive elements: 44×44px (touch-friendly, also helps with trackpad precision when the DM is distracted).

### Speed-First Interaction

- All primary actions (advance turn, add combatant, apply status) are one tap/click or one keypress.
- Encounter template load to combat-ready in under 15 seconds.
- Full setup (template + initiative entry) in under 60 seconds.
- No scrolling required to find the current turn.

---

## Scope Tiers

### V1 — The Vertical Slice

Ship this first. The core combat tracking loop must work end-to-end.

- Party Library (CRUD, D1 persistence)
- Enemy Library (custom enemies, encounter templates)
- Initiative Tracker (rapid entry, auto-sort, advance/undo turns, status conditions, round counter)
- One layout: vertical timeline, projector-optimized
- Idle Screen / slideshow mode
- Settings screen
- Auth via magic link (Resend)
- Cloudflare Pages deployment

### V1.5 — SRD Integration

- Searchable SRD 5.1/5.2 monster database (lazy-loaded JSON bundle)
- Add SRD monsters directly to encounters or copy to custom library
- CC-BY-4.0 attribution

### V2 — Polish & Presentation

- Portraits (upload to R2, display on cards and idle screen)
- Status condition duration tracking with auto-prompts
- Enemy HP display options (severity color bar, exact number toggle)
- "Boss KO" animation (one snappy, satisfying effect — nothing flashy)
- JSON export/import for backup (even with D1, this is a safety net)
- PWA with service worker for offline support

### V3 — Multiplayer

- QR code generation for game session
- Player scan-to-join: read-only view of tracker on their phone
- "Trusted player" toggle: player can edit their own HP/status
- Players can submit their own initiative rolls from their phone
- Backend: Cloudflare Durable Objects or WebSocket relay for real-time sync

### V4 — Idle Screen Enhancements

- Custom background themes for idle screen
- Ambient music integration (maybe)
- DM notes overlay visible only on the DM's screen

---

## Known Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| SRD monster JSON is 1-2MB, bloats initial load | Lazy-load as a separate chunk, only fetched when Enemy Library is opened |
| Portraits as base64 in DB would hit size limits | Store images in R2, save URL references in D1 |
| Storage calls scattered across components makes migration painful | Abstract all persistence through `storage.ts` adapter from day one |
| Encounter template search is slow mid-session with many saved encounters | Build search/filter UX, but defer exact approach until we feel the friction |
| Undo (previous turn) with status conditions gets complex in V2 | V1 stores full state snapshots per turn. Wasteful but simple and correct. Optimize later if needed |
| Keyboard shortcuts conflict with browser defaults | Test shortcut map against common browsers; use `preventDefault` carefully |

---

## Attribution

This app uses monster data from the D&D 5th Edition System Reference Document (SRD 5.1 and/or 5.2), licensed under Creative Commons Attribution 4.0 International (CC-BY-4.0) by Wizards of the Coast.

---

## Open Questions

- **App name / domain:** Working title "Marching Order." Domain search in progress.
- **Encounter template UX:** How does the DM quickly find the right encounter mid-session? Search, favorites, recents, or something else? Build first, feel the friction, then optimize.
- **Tie-breaking initiative:** Auto-resolve by DEX modifier, manual drag, or DM picks? Leaning toward manual drag for simplicity.
- **Multiple parties:** Does the DM need to manage more than one party (e.g., runs two campaigns)? Probably yes eventually, but V1 can assume one party.
