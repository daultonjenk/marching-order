import { createStorage } from '$lib/storage';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const storage = createStorage(platform);
	const [enemies, encounters] = await Promise.all([
		storage.getCustomEnemies(),
		storage.getEncounters()
	]);
	return { enemies, encounters };
};

export const actions: Actions = {
	saveEnemy: async ({ request, platform }) => {
		const storage = createStorage(platform);
		const data = await request.formData();
		await storage.saveCustomEnemy({
			id: data.get('id') as string,
			name: data.get('name') as string,
			maxHp: Number(data.get('maxHp')),
			ac: Number(data.get('ac')),
			abilities: (data.get('abilities') as string) || undefined,
			source: 'custom'
		});
	},
	deleteEnemy: async ({ request, platform }) => {
		const storage = createStorage(platform);
		const data = await request.formData();
		await storage.deleteCustomEnemy(data.get('id') as string);
	},
	saveEncounter: async ({ request, platform }) => {
		const storage = createStorage(platform);
		const data = await request.formData();
		const entries = JSON.parse(data.get('entries') as string);
		await storage.saveEncounter({
			id: data.get('id') as string,
			name: data.get('name') as string,
			notes: (data.get('notes') as string) || undefined,
			entries
		});
	},
	deleteEncounter: async ({ request, platform }) => {
		const storage = createStorage(platform);
		const data = await request.formData();
		await storage.deleteEncounter(data.get('id') as string);
	}
};
