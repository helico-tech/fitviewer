import { test, expect } from '@playwright/test';

test('app loads and renders root element', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#root')).toBeAttached();
});

test('app renders FitViewer heading', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('FitViewer')).toBeVisible();
});

test('app renders Get Started button', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
});
