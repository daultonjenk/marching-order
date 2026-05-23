import { createStorage } from '$lib/storage';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const storage = createStorage(platform);
	const [party, enemies, encounters, combatState] = await Promise.all([
		storage.getParty(),
		storage.getCustomEnemies(),
		storage.getEncounters(),
		storage.getCombatState()
	]);
	return { party, enemies, encounters, combatState };
};

export const actions: Actions = {
	saveCombat: async ({ request, platform }) => {
		const storage = createStorage(platform);
		const data = await request.formData();
		const state = JSON.parse(data.get('state') as string);
		await storage.saveCombatState(state);
	},
	clearCombat: async ({ platform }) => {
		const storage = createStorage(platform);
		await storage.clearCombatState();
	}
};
