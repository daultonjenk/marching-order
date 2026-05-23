import { expect, test, type APIRequestContext } from '@playwright/test';

const defaultSettings = {
	darkMode: false,
	showWallpaper: true,
	showPlayerHp: false,
	showPlayerAc: false,
	showEnemyHp: false,
	showEnemyAc: false,
	enemyHpFormat: 'severity',
	idleSlideDuration: 10,
	idleTransitionStyle: 'fade',
	autoRollEnemyInitiative: false,
	hpResetBehavior: 'reset',
	accentColor: '#9C7848'
};

const combatants = [
	{
		id: 'alia',
		name: 'Alia',
		type: 'player',
		initiative: 18,
		currentHp: 22,
		maxHp: 22,
		ac: 16,
		level: 5,
		passivePerception: 13,
		statuses: [],
		isDown: false,
		isDead: false
	},
	{
		id: 'bram',
		name: 'Bram',
		type: 'player',
		initiative: 15,
		currentHp: 30,
		maxHp: 30,
		ac: 17,
		level: 5,
		passivePerception: 12,
		statuses: [],
		isDown: false,
		isDead: false
	},
	{
		id: 'skeleton',
		name: 'Skeleton 1',
		type: 'enemy',
		initiative: 11,
		currentHp: 7,
		maxHp: 13,
		ac: 13,
		statuses: [],
		isDown: false,
		isDead: false
	}
] as const;

async function resetApp(request: APIRequestContext) {
	await request.delete('/api/combat');
	await request.post('/api/settings', { data: defaultSettings });
}

async function seedCombat(request: APIRequestContext, currentTurnIndex = 0) {
	await request.post('/api/combat', {
		data: {
			combatants,
			currentTurnIndex,
			round: 1,
			history: []
		}
	});
}

async function waitForApp(page: { waitForFunction: (fn: () => boolean) => Promise<unknown> }) {
	await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
}

test.beforeEach(async ({ request }) => {
	await resetApp(request);
});

test('lets DMs quick-add statless combatants during setup', async ({ page, request }) => {
	const quickPlayer = `Quick Hero ${Date.now().toString(36)}`;
	const quickEnemy = `Quick Foe ${Date.now().toString(36)}`;

	await request.post('/api/settings', {
		data: {
			...defaultSettings,
			showPlayerHp: true,
			showPlayerAc: true,
			showEnemyHp: true,
			showEnemyAc: true,
			enemyHpFormat: 'exact'
		}
	});

	await page.goto('/tracker');
	await waitForApp(page);

	const preloadedCombatants = page.getByTestId('setup-combatant');
	while ((await preloadedCombatants.count()) > 0) {
		await preloadedCombatants.first().getByRole('button', { name: /remove/i }).click();
	}

	const quickAdd = page.getByTestId('quick-add-panel');
	await expect(quickAdd).toBeVisible();

	await quickAdd.getByTestId('quick-combatant-name').fill(quickPlayer);
	await quickAdd.getByRole('button', { name: /add to lineup/i }).click();
	await quickAdd.getByRole('button', { name: /^enemy$/i }).click();
	await quickAdd.getByTestId('quick-combatant-name').fill(quickEnemy);
	await quickAdd.getByRole('button', { name: /add to lineup/i }).click();

	const setupPlayer = page.getByTestId('setup-combatant').filter({ hasText: quickPlayer });
	const setupEnemy = page.getByTestId('setup-combatant').filter({ hasText: quickEnemy });
	await expect(setupPlayer).toBeVisible();
	await expect(setupEnemy).toBeVisible();
	await expect(setupPlayer.getByTestId('setup-combatant-hp')).toHaveCount(0);
	await expect(setupPlayer.getByTestId('setup-combatant-ac')).toHaveCount(0);
	await expect(setupEnemy.getByTestId('setup-combatant-hp')).toHaveCount(0);
	await expect(setupEnemy.getByTestId('setup-combatant-ac')).toHaveCount(0);

	await page.getByRole('button', { name: /roll initiative/i }).click();
	await page.getByPlaceholder('Initiative roll').fill('20');
	await page.getByRole('button', { name: /next/i }).click();
	await page.getByPlaceholder('Initiative roll').fill('10');
	await page.getByRole('button', { name: /begin combat/i }).click();

	const activeCombatant = page.getByTestId('active-combatant-card');
	await expect(activeCombatant).toContainText(quickPlayer);
	await expect(activeCombatant.getByTestId('combatant-hp')).toHaveCount(0);
	await expect(activeCombatant.getByTestId('combatant-ac')).toHaveCount(0);
});

test('keeps the last completed turns visible when a new round starts', async ({ page, request }) => {
	await seedCombat(request);

	await page.goto('/tracker');
	await waitForApp(page);
	await page.getByRole('button', { name: /next turn/i }).click();
	await expect(page.getByTestId('active-combatant-card')).toContainText('Bram');
	await page.getByRole('button', { name: /next turn/i }).click();
	await expect(page.getByTestId('active-combatant-card')).toContainText('Skeleton 1');
	await page.getByRole('button', { name: /next turn/i }).click();

	await expect(page.getByTestId('active-combatant-card')).toContainText('Alia');
	await expect(page.getByTestId('round-counter')).toHaveText('2');

	const historyCards = page.getByTestId('turn-history').getByTestId('history-combatant-card');
	await expect(historyCards).toHaveCount(2);
	await expect(historyCards.nth(0)).toContainText('Bram');
	await expect(historyCards.nth(1)).toContainText('Skeleton 1');

	await page.getByRole('button', { name: /undo/i }).click();

	await expect(page.getByTestId('active-combatant-card')).toContainText('Skeleton 1');
	await expect(page.getByTestId('round-counter')).toHaveText('1');
	await expect(historyCards).toHaveCount(2);
	await expect(historyCards.nth(0)).toContainText('Alia');
	await expect(historyCards.nth(1)).toContainText('Bram');
});

test('hides enemy stats on the combat setup list when enemy stat display is disabled', async ({
	page
}) => {
	const enemyName = `Shadow Privacy ${Date.now()}`;

	await page.goto('/enemies');
	await waitForApp(page);
	await page.getByRole('button', { name: /\+ add enemy/i }).click();
	await page.getByLabel('Name').fill(enemyName);
	await page.getByLabel('Max HP').fill('44');
	await page.getByLabel('AC').fill('18');
	await page.getByRole('button', { name: /add enemy/i }).click();
	await expect(page.getByText(enemyName)).toBeVisible();

	await page.goto('/tracker');
	await waitForApp(page);
	await page.getByRole('button', { name: `+ ${enemyName}` }).click();

	const setupEnemy = page.getByTestId('setup-combatant').filter({ hasText: enemyName });
	await expect(setupEnemy).toBeVisible();
	await expect(setupEnemy.getByTestId('setup-combatant-hp')).toHaveCount(0);
	await expect(setupEnemy.getByTestId('setup-combatant-hp-severity')).toHaveCount(0);
	await expect(setupEnemy.getByTestId('setup-combatant-ac')).toHaveCount(0);
	await expect(setupEnemy).not.toContainText('HP: 44');
	await expect(setupEnemy).not.toContainText('AC: 18');
});

test('respects player HP and AC settings on setup and tracker cards', async ({ page, request }) => {
	const playerName = `Private Hero ${Date.now().toString(36)}`;

	await page.goto('/party');
	await waitForApp(page);
	await page.getByRole('button', { name: /\+ add member/i }).click();
	await page.getByLabel('Name').fill(playerName);
	await page.getByLabel('AC').fill('19');
	await page.getByLabel('Max HP').fill('42');
	await page.getByLabel('Level').fill('5');
	await page.getByLabel('Passive Perception').fill('14');
	await page.getByRole('button', { name: /add to party/i }).click();
	await expect(page.getByText(playerName)).toBeVisible();

	await page.goto('/tracker');
	await waitForApp(page);

	const setupPlayer = page.getByTestId('setup-combatant').filter({ hasText: playerName });
	await expect(setupPlayer).toBeVisible();
	await expect(setupPlayer.getByTestId('setup-combatant-hp')).toHaveCount(0);
	await expect(setupPlayer.getByTestId('setup-combatant-ac')).toHaveCount(0);
	await expect(setupPlayer).not.toContainText('HP: 42');
	await expect(setupPlayer).not.toContainText('AC: 19');

	await request.post('/api/settings', {
		data: {
			...defaultSettings,
			showPlayerHp: true,
			showPlayerAc: true
		}
	});
	await page.reload();
	await waitForApp(page);

	await expect(setupPlayer.getByTestId('setup-combatant-hp')).toContainText('HP: 42');
	await expect(setupPlayer.getByTestId('setup-combatant-ac')).toContainText('AC: 19');

	await seedCombat(request);
	await page.goto('/tracker');
	await waitForApp(page);

	const activePlayer = page.getByTestId('active-combatant-card');
	await expect(activePlayer).toContainText('Alia');
	await expect(activePlayer.getByTestId('combatant-hp')).toContainText('HP: 22/22');
	await expect(activePlayer.getByTestId('combatant-ac')).toContainText('AC: 16');

	await request.post('/api/settings', { data: defaultSettings });
	await page.reload();
	await waitForApp(page);

	await expect(activePlayer.getByTestId('combatant-hp')).toHaveCount(0);
	await expect(activePlayer.getByTestId('combatant-ac')).toHaveCount(0);
	await expect(activePlayer).not.toContainText('22/22');
	await expect(activePlayer).not.toContainText('AC: 16');
});

test('respects enemy HP format and AC settings on tracker cards', async ({ page, request }) => {
	await request.post('/api/settings', {
		data: {
			...defaultSettings,
			showEnemyHp: false,
			showEnemyAc: false,
			enemyHpFormat: 'severity'
		}
	});
	await seedCombat(request, 2);
	await page.goto('/tracker');
	await waitForApp(page);

	const activeEnemy = page.getByTestId('active-combatant-card');
	await expect(activeEnemy).toContainText('Skeleton 1');
	await expect(activeEnemy.getByTestId('combatant-hp')).toHaveCount(0);
	await expect(activeEnemy.getByTestId('combatant-hp-severity')).toHaveCount(0);
	await expect(activeEnemy.getByTestId('combatant-ac')).toHaveCount(0);
	await expect(activeEnemy).not.toContainText('7/13');
	await expect(activeEnemy).not.toContainText('AC: 13');

	await request.post('/api/settings', {
		data: {
			...defaultSettings,
			showEnemyHp: true,
			showEnemyAc: false,
			enemyHpFormat: 'exact'
		}
	});
	await page.reload();
	await waitForApp(page);
	await expect(activeEnemy.getByTestId('combatant-hp')).toContainText('HP: 7/13');
	await expect(activeEnemy.getByTestId('combatant-hp-severity')).toHaveCount(0);
	await expect(activeEnemy.getByTestId('combatant-ac')).toHaveCount(0);

	await request.post('/api/settings', {
		data: {
			...defaultSettings,
			showEnemyHp: true,
			showEnemyAc: true,
			enemyHpFormat: 'severity'
		}
	});
	await page.reload();
	await waitForApp(page);
	await expect(activeEnemy.getByTestId('combatant-hp')).toHaveCount(0);
	await expect(activeEnemy.getByTestId('combatant-hp-severity')).toBeVisible();
	await expect(activeEnemy.getByTestId('combatant-ac')).toContainText('AC: 13');
	await expect(activeEnemy).not.toContainText('7/13');
});
