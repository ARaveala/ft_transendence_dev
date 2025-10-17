import {test, expect} from '@playwright/test'

test('has title', async ({ page }) => {
	await page.goto('localhost:5173');
	await expect(page).toHaveTitle(/Pong/);
});
