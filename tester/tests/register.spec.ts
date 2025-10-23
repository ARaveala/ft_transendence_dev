import { test, expect } from '@playwright/test';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
test('test', async ({ page }) => {
  const username = "user" + randomInt(0, 999999);
  await page.goto('http://localhost:5173/');
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  await page.getByRole('textbox', { name: 'Username' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('password');
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.locator('form').getByRole('button', { name: 'Register' }).click();
  const welcome = page.locator('#welcome');
  await expect(welcome).toHaveText('Welcome, ' + username + '!')
});
