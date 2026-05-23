import { createStorage } from '$lib/storage';
import type { PageServerLoad, Actions } from './$types';

function optionalNumber(data: FormData, key: string): number | undefined {
	const value = data.get(key);
	if (value === null || value === '') return undefined;
	const numberValue = Number(value);
	return Number.isFinite(numberValue) ? numberValue : undefined;
}

export const load: PageServerLoad = async ({ platform }) => {
	const storage = createStorage(platform);
	const party = await storage.getParty();
	return { party };
};

export const actions: Actions = {
	save: async ({ request, platform }) => {
		const storage = createStorage(platform);
		const data = await request.formData();
		const maxHp = optionalNumber(data, 'maxHp');
		await storage.savePartyMember({
			id: data.get('id') as string,
			name: data.get('name') as string,
			ac: optionalNumber(data, 'ac'),
			maxHp,
			currentHp: maxHp === undefined ? undefined : optionalNumber(data, 'currentHp') ?? maxHp,
			level: optionalNumber(data, 'level'),
			passivePerception: optionalNumber(data, 'passivePerception')
		});
	},
	delete: async ({ request, platform }) => {
		const storage = createStorage(platform);
		const data = await request.formData();
		await storage.deletePartyMember(data.get('id') as string);
	}
};
