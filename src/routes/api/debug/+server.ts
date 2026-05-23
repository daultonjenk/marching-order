import { createStorage } from '$lib/storage';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const DEBUG_PARTY = [
	{ id: 'debug-fighter', name: 'Roderick', ac: 18, maxHp: 52, currentHp: 52, level: 5, passivePerception: 12 },
	{ id: 'debug-rogue',   name: 'Lyra Shadowstep', ac: 15, maxHp: 35, currentHp: 35, level: 5, passivePerception: 16 },
	{ id: 'debug-paladin', name: 'Brother Aldric', ac: 19, maxHp: 42, currentHp: 42, level: 5, passivePerception: 11 },
	{ id: 'debug-wizard',  name: 'Zara the Wise', ac: 13, maxHp: 28, currentHp: 28, level: 5, passivePerception: 14 },
] as const;

const DEBUG_ENEMIES = [
	{ id: 'debug-goblin',   name: 'Goblin',       maxHp: 7,   ac: 15, source: 'custom' as const, abilities: 'Nimble Escape' },
	{ id: 'debug-skeleton', name: 'Skeleton',     maxHp: 13,  ac: 13, source: 'custom' as const },
	{ id: 'debug-orc',      name: 'Orc Warrior',  maxHp: 15,  ac: 13, source: 'custom' as const, abilities: 'Aggressive' },
	{ id: 'debug-spider',   name: 'Giant Spider', maxHp: 26,  ac: 14, source: 'custom' as const, abilities: 'Web' },
	{ id: 'debug-lich',     name: 'Lich',         maxHp: 135, ac: 17, source: 'custom' as const, abilities: 'Legendary Actions, Lair Actions, Spellcasting' },
] as const;

export const POST: RequestHandler = async ({ platform }) => {
	const storage = createStorage(platform);
	await Promise.all([
		...DEBUG_PARTY.map((p) => storage.savePartyMember({ ...p })),
		...DEBUG_ENEMIES.map((e) => storage.saveCustomEnemy({ ...e })),
	]);
	return json({ ok: true });
};
