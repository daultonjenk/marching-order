import { createStorage } from '$lib/storage';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ platform }) => {
	const storage = createStorage(platform);
	const settings = await storage.getSettings();
	return { settings };
};
