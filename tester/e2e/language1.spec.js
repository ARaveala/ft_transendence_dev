import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('main')).toContainText('Register');
  await expect(page.getByRole('main')).toContainText('Login');
  await page.getByRole('button', { name: 'Finnish' }).click();
  await expect(page.getByRole('main')).toContainText('Rekisteröidy');
  await expect(page.getByRole('main')).toContainText('Kirjaudu sisään');
  await page.getByRole('button', { name: 'Ruotsi' }).click();
  await expect(page.getByRole('main')).toContainText('Registrera');
  await expect(page.getByRole('main')).toContainText('Logga in');
});
