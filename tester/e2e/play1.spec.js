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
  await page.getByRole('textbox', { name: 'Password' }).fill('asdasd');
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.locator('form').getByRole('button', { name: 'Register' }).click();
  await expect(page.getByText('Welcome, ' + user + '! 🏓')).toBeVisible();
  await page.getByRole('link', { name: 'Profile' }).click();
  await expect(page.getByRole('main')).toContainText('0');
  await expect(page.getByRole('main')).toContainText('0');
  await expect(page.getByRole('main')).toContainText('0');
  await page.goto('http://localhost:5173/');
  await expect(page.getByRole('heading', { name: 'Pong' })).toBeVisible();

  await page.getByRole('link', { name: 'Game' }).click();
  await expect(page.getByRole('heading', { name: 'Choose Game Mode' })).toBeVisible();

  await page.getByRole('button', { name: 'AI Opponent' }).click();
  await expect(page.getByRole('heading', { name: 'Game Settings' })).toBeVisible();

  await page.getByRole('spinbutton').click();
  await page.getByRole('spinbutton').click();
  await page.getByRole('spinbutton').click();
  await page.getByRole('spinbutton').dblclick();
  await page.getByRole('spinbutton').click();
  await page.getByRole('spinbutton').click();
  await page.getByRole('spinbutton').click();
  await page.getByRole('spinbutton').fill('51');
  await page.getByRole('spinbutton').press('ArrowLeft');
  await page.getByRole('spinbutton').fill('1');
  await page.getByRole('slider').first().fill('4');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'Start Game' }).click();
  await page.locator('iframe').contentFrame().getByText('OK').click();
  await expect(page.getByRole('heading', { name: 'Choose Game Mode' })).toBeVisible();

  await page.getByRole('link', { name: 'Profile' }).click();
  await expect(page.getByRole('main')).toContainText('1');
  await page.getByRole('link', { name: 'Exit' }).click();
  await expect(page.getByRole('heading', { name: 'Logout' })).toBeVisible();

  await page.getByRole('button', { name: 'Exit' }).click();
});
