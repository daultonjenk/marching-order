export interface PartyMember {
	id: string;
	name: string;
	ac: number;
	maxHp: number;
	currentHp: number;
	level: number;
	passivePerception: number;
	portraitUrl?: string;
}

export interface Enemy {
	id: string;
	name: string;
	maxHp: number;
	ac: number;
	abilities?: string;
	source: 'custom' | 'srd';
	srdSlug?: string;
}

export interface Encounter {
	id: string;
	name: string;
	entries: EncounterEntry[];
	notes?: string;
}

export interface EncounterEntry {
	enemyId: string;
	quantity: number;
}

export interface Combatant {
	id: string;
	name: string;
	type: 'player' | 'enemy';
	initiative: number;
	currentHp: number;
	maxHp: number;
	ac: number;
	level?: number;
	passivePerception?: number;
	statuses: StatusCondition[];
	isDown: boolean;
	isDead: boolean;
	portraitUrl?: string;
}

export interface StatusCondition {
	id: string;
	label: string;
	isCustom: boolean;
	roundDuration: number;
}

export interface CombatState {
	combatants: Combatant[];
	currentTurnIndex: number;
	round: number;
	history: TurnHistoryEntry[];
}

export interface TurnHistoryEntry {
	turnIndex: number;
	round: number;
	snapshot: Combatant[];
}

export interface AppSettings {
	darkMode: boolean;
	showPlayerHp: boolean;
	showEnemyHp: boolean;
	showEnemyAc: boolean;
	enemyHpFormat: 'exact' | 'severity';
	idleSlideDuration: number;
	idleTransitionStyle: 'fade' | 'slide';
	autoRollEnemyInitiative: boolean;
	hpResetBehavior: 'reset' | 'preserve';
	accentColor: string;
}
