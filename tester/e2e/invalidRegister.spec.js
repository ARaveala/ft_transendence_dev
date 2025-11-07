import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await expect(page.getByRole('button', { name: 'English' })).toBeVisible();

  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();

  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill('1invalid');
  await page.getByRole('textbox', { name: 'Username' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('short');
  await page.locator('form').getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill('validuser');
  await page.locator('form').getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill('1invalid');
  await page.getByRole('textbox', { name: 'Username' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('validpass');
  await page.locator('form').getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();
});
