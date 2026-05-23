import type { PartyMember, Enemy, Encounter, EncounterEntry, CombatState, AppSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';

function optionalPositiveNumber(value: unknown): number | undefined {
	if (value === null || value === undefined || value === '') return undefined;
	const numberValue = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
}

function optionalCurrentHp(value: unknown, maxHp: number | undefined): number | undefined {
	if (maxHp === undefined) return undefined;
	if (value === null || value === undefined || value === '') return maxHp;
	const numberValue = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : maxHp;
}

function normalizePartyMember(member: PartyMember): PartyMember {
	const maxHp = optionalPositiveNumber(member.maxHp);
	return {
		...member,
		ac: optionalPositiveNumber(member.ac),
		maxHp,
		currentHp: optionalCurrentHp(member.currentHp, maxHp),
		level: optionalPositiveNumber(member.level),
		passivePerception: optionalPositiveNumber(member.passivePerception)
	};
}

export interface StorageAdapter {
	getParty(): Promise<PartyMember[]>;
	savePartyMember(member: PartyMember): Promise<void>;
	deletePartyMember(id: string): Promise<void>;

	getCustomEnemies(): Promise<Enemy[]>;
	saveCustomEnemy(enemy: Enemy): Promise<void>;
	deleteCustomEnemy(id: string): Promise<void>;

	getEncounters(): Promise<Encounter[]>;
	saveEncounter(encounter: Encounter): Promise<void>;
	deleteEncounter(id: string): Promise<void>;

	getCombatState(): Promise<CombatState | null>;
	saveCombatState(state: CombatState): Promise<void>;
	clearCombatState(): Promise<void>;

	getSettings(): Promise<AppSettings>;
	saveSettings(settings: AppSettings): Promise<void>;
}

export class D1StorageAdapter implements StorageAdapter {
	constructor(private db: D1Database) {}

	async getParty(): Promise<PartyMember[]> {
		const rows = await this.db
			.prepare('SELECT * FROM party_members ORDER BY name')
			.all();
		return rows.results.map((r: Record<string, unknown>) => ({
			id: r.id as string,
			name: r.name as string,
			ac: optionalPositiveNumber(r.ac),
			maxHp: optionalPositiveNumber(r.max_hp),
			currentHp: optionalCurrentHp(r.current_hp, optionalPositiveNumber(r.max_hp)),
			level: optionalPositiveNumber(r.level),
			passivePerception: optionalPositiveNumber(r.passive_perception),
			portraitUrl: r.portrait_url as string | undefined
		}));
	}

	async savePartyMember(member: PartyMember): Promise<void> {
		await this.db
			.prepare(
				`INSERT INTO party_members (id, name, ac, max_hp, current_hp, level, passive_perception, portrait_url, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
				 ON CONFLICT(id) DO UPDATE SET
				   name = excluded.name, ac = excluded.ac, max_hp = excluded.max_hp,
				   current_hp = excluded.current_hp, level = excluded.level,
				   passive_perception = excluded.passive_perception,
				   portrait_url = excluded.portrait_url, updated_at = datetime('now')`
			)
			.bind(
				member.id,
				member.name,
				member.ac ?? null,
				member.maxHp ?? null,
				member.currentHp ?? null,
				member.level ?? null,
				member.passivePerception ?? null,
				member.portraitUrl ?? null
			)
			.run();
	}

	async deletePartyMember(id: string): Promise<void> {
		await this.db.prepare('DELETE FROM party_members WHERE id = ?').bind(id).run();
	}

	async getCustomEnemies(): Promise<Enemy[]> {
		const rows = await this.db
			.prepare("SELECT * FROM enemies WHERE source = 'custom' ORDER BY name")
			.all();
		return rows.results.map((r: Record<string, unknown>) => ({
			id: r.id as string,
			name: r.name as string,
			maxHp: r.max_hp as number,
			ac: r.ac as number,
			abilities: (r.abilities as string) || undefined,
			source: r.source as 'custom' | 'srd',
			srdSlug: (r.srd_slug as string) || undefined
		}));
	}

	async saveCustomEnemy(enemy: Enemy): Promise<void> {
		await this.db
			.prepare(
				`INSERT INTO enemies (id, name, max_hp, ac, abilities, source, srd_slug, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
				 ON CONFLICT(id) DO UPDATE SET
				   name = excluded.name, max_hp = excluded.max_hp, ac = excluded.ac,
				   abilities = excluded.abilities, source = excluded.source,
				   srd_slug = excluded.srd_slug, updated_at = datetime('now')`
			)
			.bind(enemy.id, enemy.name, enemy.maxHp, enemy.ac, enemy.abilities ?? null, enemy.source, enemy.srdSlug ?? null)
			.run();
	}

	async deleteCustomEnemy(id: string): Promise<void> {
		await this.db.prepare('DELETE FROM enemies WHERE id = ?').bind(id).run();
	}

	async getEncounters(): Promise<Encounter[]> {
		const rows = await this.db.prepare('SELECT * FROM encounters ORDER BY name').all();
		const encounters: Encounter[] = [];
		for (const r of rows.results as Record<string, unknown>[]) {
			const entryRows = await this.db
				.prepare('SELECT enemy_id, quantity FROM encounter_entries WHERE encounter_id = ?')
				.bind(r.id as string)
				.all();
			encounters.push({
				id: r.id as string,
				name: r.name as string,
				notes: (r.notes as string) || undefined,
				entries: entryRows.results.map((e: Record<string, unknown>) => ({
					enemyId: e.enemy_id as string,
					quantity: e.quantity as number
				}))
			});
		}
		return encounters;
	}

	async saveEncounter(encounter: Encounter): Promise<void> {
		const stmts = [
			this.db
				.prepare(
					`INSERT INTO encounters (id, name, notes, updated_at)
					 VALUES (?, ?, ?, datetime('now'))
					 ON CONFLICT(id) DO UPDATE SET
					   name = excluded.name, notes = excluded.notes, updated_at = datetime('now')`
				)
				.bind(encounter.id, encounter.name, encounter.notes ?? null),
			this.db
				.prepare('DELETE FROM encounter_entries WHERE encounter_id = ?')
				.bind(encounter.id),
			...encounter.entries.map((e) =>
				this.db
					.prepare('INSERT INTO encounter_entries (encounter_id, enemy_id, quantity) VALUES (?, ?, ?)')
					.bind(encounter.id, e.enemyId, e.quantity)
			)
		];
		await this.db.batch(stmts);
	}

	async deleteEncounter(id: string): Promise<void> {
		await this.db.batch([
			this.db.prepare('DELETE FROM encounter_entries WHERE encounter_id = ?').bind(id),
			this.db.prepare('DELETE FROM encounters WHERE id = ?').bind(id)
		]);
	}

	async getCombatState(): Promise<CombatState | null> {
		const row = await this.db
			.prepare('SELECT state_json FROM combat_state WHERE id = 1')
			.first<{ state_json: string }>();
		if (!row) return null;
		try {
			return JSON.parse(row.state_json) as CombatState;
		} catch {
			return null;
		}
	}

	async saveCombatState(state: CombatState): Promise<void> {
		await this.db
			.prepare(
				`INSERT INTO combat_state (id, state_json, updated_at)
				 VALUES (1, ?, datetime('now'))
				 ON CONFLICT(id) DO UPDATE SET
				   state_json = excluded.state_json, updated_at = datetime('now')`
			)
			.bind(JSON.stringify(state))
			.run();
	}

	async clearCombatState(): Promise<void> {
		await this.db.prepare('DELETE FROM combat_state WHERE id = 1').run();
	}

	async getSettings(): Promise<AppSettings> {
		const row = await this.db
			.prepare('SELECT settings_json FROM settings WHERE id = 1')
			.first<{ settings_json: string }>();
		if (!row) return { ...DEFAULT_SETTINGS };
		try {
			return { ...DEFAULT_SETTINGS, ...JSON.parse(row.settings_json) } as AppSettings;
		} catch {
			return { ...DEFAULT_SETTINGS };
		}
	}

	async saveSettings(settings: AppSettings): Promise<void> {
		await this.db
			.prepare(
				`INSERT INTO settings (id, settings_json, updated_at)
				 VALUES (1, ?, datetime('now'))
				 ON CONFLICT(id) DO UPDATE SET
				   settings_json = excluded.settings_json, updated_at = datetime('now')`
			)
			.bind(JSON.stringify(settings))
			.run();
	}
}

export function createStorage(platform: App.Platform | undefined): StorageAdapter {
	if (platform?.env?.DB) {
		return new D1StorageAdapter(platform.env.DB);
	}
	if (typeof window === 'undefined') {
		return memoryStorage;
	}
	return new LocalStorageAdapter();
}

type MemoryState = {
	party: PartyMember[];
	enemies: Enemy[];
	encounters: Encounter[];
	combat: CombatState | null;
	settings: AppSettings;
};

const memoryState: MemoryState = {
	party: [],
	enemies: [],
	encounters: [],
	combat: null,
	settings: { ...DEFAULT_SETTINGS }
};

class MemoryStorageAdapter implements StorageAdapter {
	async getParty(): Promise<PartyMember[]> {
		return [...memoryState.party].map(normalizePartyMember).sort((a, b) => a.name.localeCompare(b.name));
	}

	async savePartyMember(member: PartyMember): Promise<void> {
		member = normalizePartyMember(member);
		const idx = memoryState.party.findIndex((m) => m.id === member.id);
		if (idx >= 0) {
			memoryState.party[idx] = member;
		} else {
			memoryState.party.push(member);
		}
	}

	async deletePartyMember(id: string): Promise<void> {
		memoryState.party = memoryState.party.filter((m) => m.id !== id);
	}

	async getCustomEnemies(): Promise<Enemy[]> {
		return [...memoryState.enemies].sort((a, b) => a.name.localeCompare(b.name));
	}

	async saveCustomEnemy(enemy: Enemy): Promise<void> {
		const idx = memoryState.enemies.findIndex((e) => e.id === enemy.id);
		if (idx >= 0) {
			memoryState.enemies[idx] = enemy;
		} else {
			memoryState.enemies.push(enemy);
		}
	}

	async deleteCustomEnemy(id: string): Promise<void> {
		memoryState.enemies = memoryState.enemies.filter((e) => e.id !== id);
		memoryState.encounters = memoryState.encounters.map((encounter) => ({
			...encounter,
			entries: encounter.entries.filter((entry) => entry.enemyId !== id)
		}));
	}

	async getEncounters(): Promise<Encounter[]> {
		return [...memoryState.encounters].sort((a, b) => a.name.localeCompare(b.name));
	}

	async saveEncounter(encounter: Encounter): Promise<void> {
		const idx = memoryState.encounters.findIndex((e) => e.id === encounter.id);
		if (idx >= 0) {
			memoryState.encounters[idx] = encounter;
		} else {
			memoryState.encounters.push(encounter);
		}
	}

	async deleteEncounter(id: string): Promise<void> {
		memoryState.encounters = memoryState.encounters.filter((e) => e.id !== id);
	}

	async getCombatState(): Promise<CombatState | null> {
		return memoryState.combat;
	}

	async saveCombatState(state: CombatState): Promise<void> {
		memoryState.combat = state;
	}

	async clearCombatState(): Promise<void> {
		memoryState.combat = null;
	}

	async getSettings(): Promise<AppSettings> {
		return { ...DEFAULT_SETTINGS, ...memoryState.settings };
	}

	async saveSettings(settings: AppSettings): Promise<void> {
		memoryState.settings = { ...DEFAULT_SETTINGS, ...settings };
	}
}

const memoryStorage = new MemoryStorageAdapter();

class LocalStorageAdapter implements StorageAdapter {
	private get<T>(key: string, fallback: T): T {
		if (typeof window === 'undefined') return fallback;
		const raw = localStorage.getItem(`mo:${key}`);
		if (!raw) return fallback;
		try {
			return JSON.parse(raw) as T;
		} catch {
			return fallback;
		}
	}

	private set(key: string, value: unknown): void {
		if (typeof window === 'undefined') return;
		localStorage.setItem(`mo:${key}`, JSON.stringify(value));
	}

	private remove(key: string): void {
		if (typeof window === 'undefined') return;
		localStorage.removeItem(`mo:${key}`);
	}

	async getParty(): Promise<PartyMember[]> {
		return this.get<PartyMember[]>('party', [])
			.map(normalizePartyMember)
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	async savePartyMember(member: PartyMember): Promise<void> {
		member = normalizePartyMember(member);
		const party = await this.getParty();
		const idx = party.findIndex((m) => m.id === member.id);
		if (idx >= 0) {
			party[idx] = member;
		} else {
			party.push(member);
		}
		this.set('party', party);
	}

	async deletePartyMember(id: string): Promise<void> {
		const party = await this.getParty();
		this.set(
			'party',
			party.filter((m) => m.id !== id)
		);
	}

	async getCustomEnemies(): Promise<Enemy[]> {
		return this.get<Enemy[]>('enemies', []);
	}

	async saveCustomEnemy(enemy: Enemy): Promise<void> {
		const enemies = await this.getCustomEnemies();
		const idx = enemies.findIndex((e) => e.id === enemy.id);
		if (idx >= 0) {
			enemies[idx] = enemy;
		} else {
			enemies.push(enemy);
		}
		this.set('enemies', enemies);
	}

	async deleteCustomEnemy(id: string): Promise<void> {
		const enemies = await this.getCustomEnemies();
		this.set(
			'enemies',
			enemies.filter((e) => e.id !== id)
		);
	}

	async getEncounters(): Promise<Encounter[]> {
		return this.get<Encounter[]>('encounters', []);
	}

	async saveEncounter(encounter: Encounter): Promise<void> {
		const encounters = await this.getEncounters();
		const idx = encounters.findIndex((e) => e.id === encounter.id);
		if (idx >= 0) {
			encounters[idx] = encounter;
		} else {
			encounters.push(encounter);
		}
		this.set('encounters', encounters);
	}

	async deleteEncounter(id: string): Promise<void> {
		const encounters = await this.getEncounters();
		this.set(
			'encounters',
			encounters.filter((e) => e.id !== id)
		);
	}

	async getCombatState(): Promise<CombatState | null> {
		return this.get<CombatState | null>('combat', null);
	}

	async saveCombatState(state: CombatState): Promise<void> {
		this.set('combat', state);
	}

	async clearCombatState(): Promise<void> {
		this.remove('combat');
	}

	async getSettings(): Promise<AppSettings> {
		return this.get<AppSettings>('settings', DEFAULT_SETTINGS);
	}

	async saveSettings(settings: AppSettings): Promise<void> {
		this.set('settings', settings);
	}
}
