const { test, expect } = require('@playwright/test');

test.describe('LLM Settings Tab', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        // Wait for the page to load
        await page.waitForSelector('button:has-text("Settings")');
        await page.click('button:has-text("Settings")');
        // Wait for settings modal to open
        await page.waitForSelector('text=Game Settings');
    });

    test('should display LLM tab in settings', async ({ page }) => {
        // Check if LLM tab exists
        const llmTab = page.locator('button[role="tab"]:has-text("LLM")');
        await expect(llmTab).toBeVisible();
        
        // Click on LLM tab
        await llmTab.click();
        
        // Check if LLM content is visible
        await expect(page.locator('text=LLM Providers')).toBeVisible();
        await expect(page.locator('text=AI Players')).toBeVisible();
    });

    test('should add new LLM provider', async ({ page }) => {
        // Navigate to LLM tab
        await page.click('button[role="tab"]:has-text("LLM")');
        
        // Click add provider button
        await page.click('button:has-text("Add Provider")');
        
        // Check if provider form is visible
        await expect(page.locator('input[placeholder="Provider Name"]')).toBeVisible();
        await expect(page.locator('input[placeholder="API Key"]')).toBeVisible();
        await expect(page.locator('input[placeholder="Model Name"]')).toBeVisible();
    });

    test('should add new AI player', async ({ page }) => {
        // Navigate to LLM tab
        await page.click('button[role="tab"]:has-text("LLM")');
        
        // Click add player button
        await page.click('button:has-text("Add Player")');
        
        // Check if player form is visible
        await expect(page.locator('input[placeholder="Player Name"]')).toBeVisible();
        await expect(page.locator('textarea[placeholder="Personality description"]')).toBeVisible();
        await expect(page.locator('button:has-text("Change Avatar")')).toBeVisible();
    });

    test('should change AI player avatar', async ({ page }) => {
        // Navigate to LLM tab
        await page.click('button[role="tab"]:has-text("LLM")');
        
        // Add a player first
        await page.click('button:has-text("Add Player")');
        
        // Get initial avatar
        const initialAvatar = await page.locator('img[alt="New AI Player"]').getAttribute('src');
        
        // Click change avatar button
        await page.click('button:has-text("Change Avatar")');
        
        // Check if avatar changed
        const newAvatar = await page.locator('img[alt="New AI Player"]').getAttribute('src');
        expect(newAvatar).not.toBe(initialAvatar);
    });

    test('should remove LLM provider', async ({ page }) => {
        // Navigate to LLM tab
        await page.click('button[role="tab"]:has-text("LLM")');
        
        // Add a provider first
        await page.click('button:has-text("Add Provider")');
        
        // Fill in provider details
        await page.fill('input[placeholder="Provider Name"]', 'Test Provider');
        await page.fill('input[placeholder="API Key"]', 'test-key');
        await page.fill('input[placeholder="Model Name"]', 'test-model');
        
        // Click remove button
        await page.click('button:has-text("Remove")');
        
        // Check if provider is removed
        await expect(page.locator('text=Test Provider')).not.toBeVisible();
    });

    test('should remove AI player', async ({ page }) => {
        // Navigate to LLM tab
        await page.click('button[role="tab"]:has-text("LLM")');
        
        // Add a player first
        await page.click('button:has-text("Add Player")');
        
        // Fill in player details
        await page.fill('input[placeholder="Player Name"]', 'Test Player');
        await page.fill('textarea[placeholder="Personality description"]', 'Test personality');
        
        // Click remove player button
        await page.click('button:has-text("Remove Player")');
        
        // Check if player is removed
        await expect(page.locator('text=Test Player')).not.toBeVisible();
    });
});
