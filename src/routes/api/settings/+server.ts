import { createStorage } from '$lib/storage';
import { json } from '@sveltejs/kit';
import type { AppSettings } from '$lib/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	const storage = createStorage(platform);
	const settings = (await request.json()) as AppSettings;
	await storage.saveSettings(settings);
	return json({ ok: true });
};
