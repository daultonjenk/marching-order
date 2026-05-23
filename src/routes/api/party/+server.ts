import { createStorage } from '$lib/storage';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ platform }) => {
	const storage = createStorage(platform);
	await storage.clearParty();
	return json({ ok: true });
};
