import type { AppSettings } from './types';

export const STATUS_CONDITIONS = [
	'Blinded',
	'Charmed',
	'Deafened',
	'Frightened',
	'Grappled',
	'Incapacitated',
	'Invisible',
	'Paralyzed',
	'Petrified',
	'Poisoned',
	'Prone',
	'Restrained',
	'Stunned',
	'Unconscious'
] as const;

export const DEFAULT_SETTINGS: AppSettings = {
	darkMode: false,
	showWallpaper: true,
	showPlayerAc: false,
	showEnemyHp: false,
	showEnemyAc: false,
	enemyHpFormat: 'severity',
	idleSlideDuration: 10,
	idleTransitionStyle: 'fade',
	autoRollEnemyInitiative: false
};

export const KEYBOARD_SHORTCUTS = {
	nextTurn: ' ',
	previousTurn: ['Shift+ ', 'Backspace'],
	cancel: 'Escape',
	addCombatant: 'a',
	toggleStatus: 's'
} as const;
