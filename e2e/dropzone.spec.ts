import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

test.describe('DropZone', () => {
  test('file input accepts .fit files', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    await expect(fileInput).toHaveAttribute('accept', '.fit');
  });

  test('clicking Browse files triggers file input', async ({ page }) => {
    await page.goto('/');

    // Listen for the file chooser dialog
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Browse files' }).click();
    const fileChooser = await fileChooserPromise;

    expect(fileChooser).toBeTruthy();
  });

  test('shows error toast when non-.fit file is selected', async ({ page }) => {
    await page.goto('/');

    // Create a temporary non-fit file
    const tmpFile = path.join(os.tmpdir(), 'test.txt');
    fs.writeFileSync(tmpFile, 'not a fit file');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tmpFile);

    // Verify error toast appears
    await expect(page.getByText('Invalid file type')).toBeVisible();
    await expect(page.getByText('Please select a .fit file')).toBeVisible();

    // Cleanup
    fs.unlinkSync(tmpFile);
  });

  test('drop zone has full-page layout', async ({ page }) => {
    await page.goto('/');

    const dropZone = page.locator('div.min-h-screen');
    await expect(dropZone).toBeVisible();
  });
});
