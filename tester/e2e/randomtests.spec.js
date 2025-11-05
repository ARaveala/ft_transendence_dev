import { test, expect } from '@playwright/test';
const { randomUsername } = require('./utils');
test('test', async ({ page }) => {
    const user = randomUsername();
  await page.goto('http://localhost:5173/');
  await expect(page.getByRole('button', { name: 'English' })).toBeVisible();

  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();

  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill(user);
  await page.getByRole('textbox', { name: 'Username' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('asdasdasd');
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.locator('form').getByRole('button', { name: 'Register' }).click();
  await expect(page.getByText('Welcome, '+user+'! 🏓')).toBeVisible();
  await page.getByRole('link', { name: 'Profile' }).click();
  await expect(page.getByRole('main')).toContainText('0');
  await expect(page.getByRole('main')).toContainText('0');
  await page.getByRole('link', { name: 'Friends' }).click();
  await expect(page.getByRole('heading', { name: 'Friends', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Add friend by username' }).click();
  await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeVisible();

  await page.getByRole('textbox').click();
  await page.getByRole('textbox').fill('asd');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText('asd')).toBeVisible();
  await page.getByRole('button', { name: 'Remove friend' }).click();
  await expect(page.getByRole('heading', { name: 'Remove friend?' })).toBeVisible();

  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.getByText('No friends yet.')).toBeVisible();
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

  await page.getByRole('button', { name: 'Change language' }).click();
  await page.getByRole('combobox').selectOption('fi');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('h1')).toContainText('Asetukset');
  await page.getByRole('button', { name: 'Poista profiili' }).click();
  await expect(page.getByRole('heading', { name: 'Pong' })).toBeVisible();
});
