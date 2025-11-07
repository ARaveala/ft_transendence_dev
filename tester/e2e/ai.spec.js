import { test, expect } from '@playwright/test';
const {randomUsername} = require('./utils.js');

test('test', async ({ page }) => {
    const username = randomUsername();
  await page.goto('http://localhost:5173/');
  await expect(page.getByRole('button', { name: 'English' })).toBeVisible();

  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();

  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  await page.getByRole('textbox', { name: 'Username' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('asdasdasd');
  await page.locator('form').getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();

  await page.getByRole('link', { name: 'Game' }).click();
  await expect(page.getByRole('heading', { name: 'Choose game mode' })).toBeVisible();

  await page.getByRole('button', { name: 'AI opponent' }).click();
  await expect(page.getByRole('heading', { name: 'Game settings' })).toBeVisible();

  await page.getByRole('spinbutton').click();
  await page.getByRole('spinbutton').fill('');
  await page.getByRole('spinbutton').press('ArrowUp');
  await page.getByRole('spinbutton').fill('2');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await page.locator('iframe').contentFrame().getByText('OK').click();
  await expect(page.getByRole('heading', { name: 'Choose game mode' })).toBeVisible();
});
