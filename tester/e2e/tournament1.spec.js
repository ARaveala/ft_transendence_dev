import { test, expect } from '@playwright/test';
const { randomUsername, randomizeNUsernames } = require('./utils');

test('test', async ({ page }) => {
    const usernames = randomizeNUsernames(4);
  await page.goto('http://localhost:5173/');
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

  await page.getByRole('link', { name: 'Exit' }).click();
  await expect(page.getByRole('heading', { name: 'Logout' })).toBeVisible();

  await page.getByRole('button', { name: 'Exit' }).click();
  await expect(page.getByRole('button', { name: 'English' })).toBeVisible();

  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();

  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill(usernames[2]);
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
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill(usernames[3]);
  await page.getByRole('textbox', { name: 'Username' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('asdasdasd');
  await page.locator('form').getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();

  await page.getByRole('link', { name: 'Tournament' }).click();
  await expect(page.getByRole('heading', { name: 'Tournament' })).toBeVisible();

  await page.getByRole('button', { name: 'Start a new tournament' }).click();
  await expect(page.getByRole('textbox', { name: 'Username' }).first()).toBeVisible();
  await page.getByRole('textbox', { name: 'Alias' }).first().click();
  await page.getByRole('textbox', { name: 'Alias' }).first().fill('alias4');
  await page.getByRole('button', { name: 'Set Alias' }).click();
  await expect(page.getByRole('button', { name: 'Edit Alias' })).toBeVisible();

  await page.getByRole('textbox', { name: 'Username' }).nth(1).click();
  await page.getByRole('textbox', { name: 'Username' }).nth(1).fill(usernames[2]);
  await page.getByRole('textbox', { name: 'Username' }).nth(1).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).nth(1).fill('asdasdasd');
  await page.getByRole('textbox', { name: 'Password' }).nth(1).press('Tab');
  await page.getByRole('textbox', { name: 'Alias' }).nth(1).fill('alias3');
  await page.getByRole('button', { name: 'Add Player' }).first().click();
  await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible();

  await page.getByRole('textbox', { name: 'Username' }).nth(2).click();
  await page.getByRole('textbox', { name: 'Username' }).nth(2).fill(usernames[1]);
  await page.getByRole('textbox', { name: 'Username' }).nth(2).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).nth(2).fill('asdasdasd');
  await page.getByRole('textbox', { name: 'Password' }).nth(2).press('Tab');
  await page.getByRole('textbox', { name: 'Alias' }).nth(2).fill('alias2');
  await page.getByRole('button', { name: 'Add Player' }).first().click();
  await page.getByRole('textbox', { name: 'Username' }).nth(3).click();
  await page.getByRole('textbox', { name: 'Username' }).nth(3).fill(usernames[0]);
  await page.getByRole('textbox', { name: 'Username' }).nth(3).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).nth(3).fill('asdasdasd');
  await page.getByRole('textbox', { name: 'Password' }).nth(3).press('Tab');
  await page.getByRole('textbox', { name: 'Alias' }).nth(3).fill('alias1');
  await page.getByRole('button', { name: 'Add Player' }).click();
  await page.getByRole('button', { name: 'Start Tournament' }).click();
  await expect(page.getByRole('heading', { name: 'Winner' })).toBeVisible();

////////here


  await page.getByRole('button', { name: 'Play Match 1' }).click();
  await expect(page.getByRole('heading', { name: 'Game Settings' })).toBeVisible();

  await page.getByRole('spinbutton').click();
  await page.getByRole('spinbutton').fill('51');
  await page.getByRole('spinbutton').press('ArrowLeft');
  await page.getByRole('spinbutton').fill('1');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'Start Game' }).click();
  await page.locator('iframe').contentFrame().getByText('OK').click();
  await expect(page.getByRole('heading', { name: 'Tournament' })).toBeVisible();

  await page.getByRole('button', { name: 'Play Match 2' }).click();
  await page.locator('iframe').contentFrame().getByText('OK').click();
  await page.getByRole('button', { name: 'Play Final' }).click();
  await expect(page.frameLocator('iframe').getByText('OK')).toBeVisible();

  await page.locator('iframe').contentFrame().getByText('OK').click();
 
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

  await page.getByRole('button', { name: 'Delete profile' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByRole('button', { name: 'English' })).toBeVisible();

  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();

  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill(usernames[2]);
  await page.getByRole('textbox', { name: 'Username' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('asdasdasd');
  await page.locator('form').getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();

  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

  await page.getByRole('button', { name: 'Delete profile' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByRole('button', { name: 'English' })).toBeVisible();

  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();

  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill(usernames[1]);
  await page.getByRole('textbox', { name: 'Username' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('asdasdasd');

  await page.waitForSelector('form >> text=Login', { state: 'visible' });

  await page.locator('form').getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();

  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

  await page.getByRole('button', { name: 'Delete profile' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByRole('button', { name: 'English' })).toBeVisible();

  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();

  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill(usernames[0]);
  await page.getByRole('textbox', { name: 'Username' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('asdasdasd');
  await page.locator('form').getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();

  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

  await page.getByRole('button', { name: 'Delete profile' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByRole('heading', { name: 'Pong' })).toBeVisible();
});
