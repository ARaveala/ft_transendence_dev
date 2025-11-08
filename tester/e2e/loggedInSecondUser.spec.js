import { test, expect } from '@playwright/test';
const { randomizeNUsernames } = require('./utils.js');
test.use({ ignoreHTTPSErrors: true });
test('test', async ({ page }) => {
    const usernames = randomizeNUsernames(2);
  await page.goto('https://localhost:4004/');
  await expect(page.getByRole('button', { name: 'English' })).toBeVisible();

  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();

  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill(usernames[0]);
  await page.getByRole('textbox', { name: 'Username' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('asdasdasd');
  await page.locator('form').getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();

  await page.getByRole('link', { name: 'Exit' }).click();
  await expect(page.getByRole('heading', { name: 'Logout' })).toBeVisible();

  await page.getByRole('button', { name: 'Exit' }).click();
  await expect(page.getByRole('button', { name: 'English' })).toBeVisible();

  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();

  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill(usernames[1]);
  await page.getByRole('textbox', { name: 'Username' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('asdasdasd');
  await page.locator('form').getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();

  await page.getByRole('link', { name: 'Game' }).click();
  await expect(page.getByRole('heading', { name: 'Choose game mode' })).toBeVisible();

  await page.getByRole('button', { name: 'Logged-in second player' }).click();
  await expect(page.getByRole('heading', { name: 'Log in as Player' })).toBeVisible();

  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill(usernames[0]);
  await page.getByRole('textbox', { name: 'Username' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('asdasdasd');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('heading', { name: 'Game settings' })).toBeVisible();

  await page.getByRole('spinbutton').click();
  await page.getByRole('spinbutton').fill('1');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await page.locator('iframe').contentFrame().getByText('OK').click();
  await expect(page.getByRole('heading', { name: 'Choose game mode' })).toBeVisible();
});
