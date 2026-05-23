import { createStorage } from '$lib/storage';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const storage = createStorage(platform);
	const party = await storage.getParty();
	return { party };
};

export const actions: Actions = {
	save: async ({ request, platform }) => {
		const storage = createStorage(platform);
		const data = await request.formData();
		await storage.savePartyMember({
			id: data.get('id') as string,
			name: data.get('name') as string,
			ac: Number(data.get('ac')),
			maxHp: Number(data.get('maxHp')),
			currentHp: Number(data.get('currentHp')),
			level: Number(data.get('level')),
			passivePerception: Number(data.get('passivePerception'))
		});
	},
	delete: async ({ request, platform }) => {
		const storage = createStorage(platform);
		const data = await request.formData();
		await storage.deletePartyMember(data.get('id') as string);
	}
};
