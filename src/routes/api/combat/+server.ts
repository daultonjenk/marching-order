import { createStorage } from '$lib/storage';
import { json } from '@sveltejs/kit';
import type { CombatState } from '$lib/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	const storage = createStorage(platform);
	const state = (await request.json()) as CombatState;
	await storage.saveCombatState(state);
	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ platform }) => {
	const storage = createStorage(platform);
	await storage.clearCombatState();
	return json({ ok: true });
};
