import type { AppSettings } from './types';
import { DEFAULT_SETTINGS, ACCENT_COLORS } from './constants';
import { storage } from './storage';

class SettingsState {
	current = $state<AppSettings>({ ...DEFAULT_SETTINGS });
	loaded = $state(false);

	async load() {
		this.current = await storage.getSettings();
		this.applyAccentColor();
		this.loaded = true;
	}

	async update(patch: Partial<AppSettings>) {
		this.current = { ...this.current, ...patch };
		this.applyAccentColor();
		await storage.saveSettings(this.current);
	}

	private applyAccentColor() {
		if (typeof document === 'undefined') return;
		const color = ACCENT_COLORS.find((c) => c.value === this.current.accentColor) ?? ACCENT_COLORS[0];
		const root = document.documentElement;
		root.style.setProperty('--accent', color.value);
		root.style.setProperty('--accent-light', color.light);
		root.style.setProperty('--accent-glow', color.glow);
		root.style.setProperty('--accent-shadow', color.shadow);
	}
}

export const settings = new SettingsState();
