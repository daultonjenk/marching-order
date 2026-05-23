import { createStorage } from '$lib/storage';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const storage = createStorage(platform);
	const party = await storage.getParty();
	return { party };
};
