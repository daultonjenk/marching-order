import type { AppSettings } from './types';
import { DEFAULT_SETTINGS, ACCENT_COLORS } from './constants';

class SettingsState {
	current = $state<AppSettings>({ ...DEFAULT_SETTINGS });
	loaded = $state(false);

	init(serverSettings: AppSettings) {
		this.current = { ...DEFAULT_SETTINGS, ...serverSettings };
		this.applyAppearance();
		this.loaded = true;
	}

	async update(patch: Partial<AppSettings>) {
		this.current = { ...this.current, ...patch };
		this.applyAppearance();
		await fetch('/api/settings', {
			method: 'POST',
			body: JSON.stringify(this.current),
			headers: { 'Content-Type': 'application/json' }
		});
	}

	private applyAppearance() {
		if (typeof document === 'undefined') return;
		const color = ACCENT_COLORS.find((c) => c.value === this.current.accentColor) ?? {
			value: this.current.accentColor,
			light: this.current.accentColor,
			glow: `${this.current.accentColor}59`,
			shadow: `${this.current.accentColor}73`
		};
		const root = document.documentElement;
		root.dataset.theme = this.current.darkMode ? 'dark' : 'light';
		root.dataset.wallpaper = this.current.showWallpaper ? 'on' : 'off';
		root.style.setProperty('--accent', color.value);
		root.style.setProperty('--accent-light', color.light);
		root.style.setProperty('--accent-glow', color.glow);
		root.style.setProperty('--accent-shadow', color.shadow);
	}
}

export const settings = new SettingsState();
