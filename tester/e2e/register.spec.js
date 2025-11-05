import { test, expect } from '@playwright/test';
const { randomUsername, randomizeNUsernames } = require('./utils');
test('test', async ({ page }) => {
    const username = randomUsername();
  await page.goto('http://localhost:5173/');
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  await page.getByRole('textbox', { name: 'Username' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('qwe123123');
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.locator('form').getByRole('button', { name: 'Register' }).click();
  await expect(page.getByText('Welcome, ' + username + '! 🏓')).toBeVisible();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Delete profile' }).click();
  await expect(page.getByRole('heading', { name: 'Pong' })).toBeVisible();
});
