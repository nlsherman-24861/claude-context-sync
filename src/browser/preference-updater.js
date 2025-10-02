import { chromium } from 'playwright';
import { SessionManager } from './session-manager.js';

/**
 * PreferenceUpdater handles headless browser automation to update Claude Chat preferences.
 * Uses saved Playwright session for authentication.
 */
export class PreferenceUpdater {
  constructor() {
    this.sessionManager = new SessionManager();
  }

  /**
   * Update Claude Chat preferences using headless browser automation
   * @param {string} preferencesText - The preferences content to set
   * @param {object} options - Options for the update
   * @param {boolean} options.dryRun - If true, preview without making changes
   * @param {boolean} options.verbose - If true, show detailed logging
   * @returns {Promise<object>} Result object with success status
   */
  async updatePreferences(preferencesText, options = {}) {
    const { dryRun = false, verbose = false } = options;

    if (dryRun) {
      console.log('DRY RUN - Would update preferences to:');
      console.log(preferencesText);
      return { success: true, dryRun: true };
    }

    // Validate session first
    if (verbose) console.log('Validating session...');
    const validation = await this.sessionManager.validateSession();

    if (!validation.valid) {
      throw new Error(
        `Session invalid: ${validation.reason}. Run: claude-context-sync setup --refresh-session`
      );
    }

    if (verbose) console.log('Session valid, launching browser...');

    const browser = await chromium.launch({ headless: true });

    try {
      const context = await browser.newContext({
        storageState: this.sessionManager.sessionPath,
      });

      const page = await context.newPage();

      // Navigate to settings
      if (verbose) console.log('Navigating to Claude settings...');
      await page.goto('https://claude.ai/settings/profile', {
        timeout: 30000,
        waitUntil: 'networkidle',
      });

      // Find preferences section
      if (verbose) console.log('Locating preferences field...');
      const prefsField = await this.findPreferencesField(page);

      if (!prefsField) {
        throw new Error(
          'Could not locate preferences field. UI may have changed.'
        );
      }

      // Clear and update
      if (verbose) console.log('Updating preferences...');
      await prefsField.fill(preferencesText);

      // Save
      if (verbose) console.log('Saving changes...');
      await this.clickSaveButton(page);

      // Wait for save confirmation
      await this.waitForSaveConfirmation(page);

      if (verbose) console.log('Preferences updated successfully!');

      await browser.close();

      return { success: true };
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  /**
   * Find the preferences textarea field using multiple selector strategies
   * @param {object} page - Playwright page object
   * @returns {Promise<object|null>} Locator for preferences field or null
   */
  async findPreferencesField(page) {
    // Try multiple selector strategies for resilience
    const selectors = [
      'textarea[name="preferences"]',
      'textarea[placeholder*="preferences"]',
      'textarea[placeholder*="custom instructions"]',
      'textarea[aria-label*="preferences"]',
      'textarea[aria-label*="custom instructions"]',
      '[data-testid="preferences-textarea"]',
      'textarea', // Last resort - find any textarea on settings page
    ];

    for (const selector of selectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        return element;
      }
    }

    return null;
  }

  /**
   * Click the save button using multiple selector strategies
   * @param {object} page - Playwright page object
   */
  async clickSaveButton(page) {
    const selectors = [
      'button:has-text("Save")',
      'button[type="submit"]',
      'button:has-text("Update")',
      '[data-testid="save-button"]',
    ];

    for (const selector of selectors) {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
        await button.click();
        return;
      }
    }

    throw new Error('Could not find save button. UI may have changed.');
  }

  /**
   * Wait for save confirmation message
   * @param {object} page - Playwright page object
   */
  async waitForSaveConfirmation(page) {
    // Look for success messages
    const confirmationSelectors = [
      'text=Saved',
      'text=Updated successfully',
      'text=Changes saved',
      '[data-testid="success-message"]',
      '.success-notification',
    ];

    try {
      await page.waitForSelector(confirmationSelectors.join(','), {
        timeout: 5000,
      });
    } catch {
      // No explicit confirmation - assume success if no error
      console.warn('No save confirmation detected, but no errors either');
    }
  }
}
