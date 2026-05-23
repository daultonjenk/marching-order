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

export const ACCENT_COLORS = [
	{ value: '#9C7848', label: 'Bronze', light: '#D4A574', glow: 'rgba(156, 120, 72, 0.35)', shadow: 'rgba(156, 120, 72, 0.45)' },
	{ value: '#2A6FDB', label: 'Blue', light: '#5B94E8', glow: 'rgba(42, 111, 219, 0.35)', shadow: 'rgba(42, 111, 219, 0.45)' },
	{ value: '#1F8A5B', label: 'Green', light: '#4CAF7D', glow: 'rgba(31, 138, 91, 0.35)', shadow: 'rgba(31, 138, 91, 0.45)' },
	{ value: '#D94444', label: 'Red', light: '#E67373', glow: 'rgba(217, 68, 68, 0.35)', shadow: 'rgba(217, 68, 68, 0.45)' },
	{ value: '#8B5CF6', label: 'Purple', light: '#A78BFA', glow: 'rgba(139, 92, 246, 0.35)', shadow: 'rgba(139, 92, 246, 0.45)' },
	{ value: '#F59E0B', label: 'Amber', light: '#FBBF24', glow: 'rgba(245, 158, 11, 0.35)', shadow: 'rgba(245, 158, 11, 0.45)' }
] as const;

export const DEFAULT_SETTINGS: AppSettings = {
	darkMode: false,
	showWallpaper: true,
	showPlayerHp: true,
	showEnemyHp: false,
	showEnemyAc: false,
	enemyHpFormat: 'severity',
	idleSlideDuration: 10,
	idleTransitionStyle: 'fade',
	autoRollEnemyInitiative: false,
	hpResetBehavior: 'reset',
	accentColor: '#9C7848'
};

export const KEYBOARD_SHORTCUTS = {
	nextTurn: ' ',
	previousTurn: ['Shift+ ', 'Backspace'],
	cancel: 'Escape',
	addCombatant: 'a',
	toggleStatus: 's'
} as const;
