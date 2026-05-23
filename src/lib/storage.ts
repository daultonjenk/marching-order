import type { PartyMember, Enemy, Encounter, CombatState, AppSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';

interface StorageAdapter {
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
		return this.get<PartyMember[]>('party', []);
	}

	async savePartyMember(member: PartyMember): Promise<void> {
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

export const storage: StorageAdapter = new LocalStorageAdapter();
