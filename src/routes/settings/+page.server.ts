import { createStorage } from '$lib/storage';
import type { Actions } from './$types';

export const actions: Actions = {
	save: async ({ request, platform }) => {
		const storage = createStorage(platform);
		const data = await request.formData();
		const settings = JSON.parse(data.get('settings') as string);
		await storage.saveSettings(settings);
	}
};
