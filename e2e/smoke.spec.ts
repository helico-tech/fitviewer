import { test, expect } from '@playwright/test';

test('app loads and renders root element', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#root')).toBeAttached();
});

test('app renders FitViewer heading', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('FitViewer')).toBeVisible();
});

test('app renders Browse files button', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Browse files' })).toBeVisible();
});

test('drop zone shows drag-and-drop instructions', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Drag & drop a .fit file to analyze your run')).toBeVisible();
});

test('drop zone shows supported devices text', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Supports .fit files from Garmin')).toBeVisible();
});
