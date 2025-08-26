const { test, expect } = require('@playwright/test');

test.describe('LLM Integration with Default Players', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3091');
        // Wait for the page to load
        await page.waitForSelector('button:has-text("Settings")');
        await page.click('button:has-text("Settings")');
        // Wait for settings modal to open
        await page.waitForSelector('text=Game Settings');
    });

    test('should show default players with Basic AI by default', async ({ page }) => {
        // Navigate to LLM tab
        await page.click('button[role="tab"]:has-text("LLM")');
        
        // Check if default players are visible
        await expect(page.locator('text=Alice')).toBeVisible();
        await expect(page.locator('text=Bob')).toBeVisible();
        await expect(page.locator('text=Carol')).toBeVisible();
        await expect(page.locator('text=Dave')).toBeVisible();
        await expect(page.locator('text=Eve')).toBeVisible();
        
        // Check if they have "Basic AI" badges
        const basicAIBadges = page.locator('text=Basic AI');
        await expect(basicAIBadges).toHaveCount(5);
        
        // Check if they have "D" indicators for default players
        const defaultIndicators = page.locator('.bg-blue-500');
        await expect(defaultIndicators).toHaveCount(5);
    });

    test('should allow assigning LLM to default players', async ({ page }) => {
        // Navigate to LLM tab
        await page.click('button[role="tab"]:has-text("LLM")');
        
        // Find Alice's LLM selector and change it to OpenAI
        const aliceLLMSelect = page.locator('text=Alice').locator('..').locator('select').first();
        await aliceLLMSelect.click();
        await page.locator('text=OpenAI').click();
        
        // Check if Alice now has LLM badge
        await expect(page.locator('text=Alice').locator('..').locator('text=LLM')).toBeVisible();
    });

    test('should not allow removing default players', async ({ page }) => {
        // Navigate to LLM tab
        await page.click('button[role="tab"]:has-text("LLM")');
        
        // Check that default players don't have remove buttons
        const aliceCard = page.locator('text=Alice').locator('..').locator('..').locator('..');
        await expect(aliceCard.locator('text=Remove Player')).not.toBeVisible();
        await expect(aliceCard.locator('text=Default player - cannot be removed')).toBeVisible();
    });

    test('should allow adding custom players', async ({ page }) => {
        // Navigate to LLM tab
        await page.click('button[role="tab"]:has-text("LLM")');
        
        // Add a custom player
        await page.click('button:has-text("Add Player")');
        
        // Check if new player is added
        await expect(page.locator('text=New AI Player')).toBeVisible();
        
        // Check if custom player can be removed
        const newPlayerCard = page.locator('text=New AI Player').locator('..').locator('..').locator('..');
        await expect(newPlayerCard.locator('text=Remove Player')).toBeVisible();
    });

    test('should show info section explaining player types', async ({ page }) => {
        // Navigate to LLM tab
        await page.click('button[role="tab"]:has-text("LLM")');
        
        // Check if info section is visible
        await expect(page.locator('text=Player Types:')).toBeVisible();
        await expect(page.locator('text=Basic AI')).toBeVisible();
        await expect(page.locator('text=LLM')).toBeVisible();
        await expect(page.locator('text=Uses the existing game AI (default)')).toBeVisible();
        await expect(page.locator('text=Uses configured LLM provider for enhanced gameplay')).toBeVisible();
    });
});
