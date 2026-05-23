import type { AppSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';

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
		const root = document.documentElement;
		root.dataset.theme = this.current.darkMode ? 'dark' : 'light';
		root.dataset.wallpaper = this.current.showWallpaper ? 'on' : 'off';
		if (this.current.darkMode) {
			root.style.setProperty('--accent', '#9C7848');
			root.style.setProperty('--accent-light', '#D4A574');
			root.style.setProperty('--accent-glow', 'rgba(156, 120, 72, 0.35)');
			root.style.setProperty('--accent-shadow', 'rgba(156, 120, 72, 0.45)');
		} else {
			root.style.setProperty('--accent', '#3E3E3E');
			root.style.setProperty('--accent-light', '#6E6E6E');
			root.style.setProperty('--accent-glow', 'rgba(62, 62, 62, 0.35)');
			root.style.setProperty('--accent-shadow', 'rgba(62, 62, 62, 0.45)');
		}
	}
}

export const settings = new SettingsState();
