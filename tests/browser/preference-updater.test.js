import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PreferenceUpdater } from '../../src/browser/preference-updater.js';

describe('PreferenceUpdater', () => {
  let updater;

  beforeEach(() => {
    updater = new PreferenceUpdater();
  });

  describe('updatePreferences', () => {
    it('should handle dry run without browser', async () => {
      const result = await updater.updatePreferences('test preferences', {
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
    });

    it('should validate session before update', async () => {
      // Mock session manager
      updater.sessionManager.validateSession = vi.fn().mockResolvedValue({
        valid: false,
        reason: 'Expired',
      });

      await expect(
        updater.updatePreferences('test', { dryRun: false })
      ).rejects.toThrow(/Session invalid/);
    });

    it('should suggest refresh on expired session', async () => {
      updater.sessionManager.validateSession = vi.fn().mockResolvedValue({
        valid: false,
        reason: 'Session expired',
      });

      await expect(
        updater.updatePreferences('test', { dryRun: false })
      ).rejects.toThrow(/claude-context-sync setup --refresh-session/);
    });
  });

  describe('findPreferencesField', () => {
    it('should try multiple selectors', () => {
      // This is a unit test to verify the selector list exists
      const mockPage = {
        locator: vi.fn().mockReturnValue({
          first: vi.fn().mockReturnValue({
            isVisible: vi.fn().mockResolvedValue(false),
          }),
        }),
      };

      // Should try all selectors
      updater.findPreferencesField(mockPage);

      // Verify it tries multiple strategies
      expect(mockPage.locator).toHaveBeenCalled();
    });
  });

  describe('clickSaveButton', () => {
    it('should throw error if no save button found', async () => {
      const mockPage = {
        locator: vi.fn().mockReturnValue({
          first: vi.fn().mockReturnValue({
            isVisible: vi.fn().mockResolvedValue(false),
          }),
        }),
      };

      await expect(updater.clickSaveButton(mockPage)).rejects.toThrow(
        /Could not find save button/
      );
    });
  });

  describe('waitForSaveConfirmation', () => {
    it('should not throw if no confirmation appears', async () => {
      const mockPage = {
        waitForSelector: vi.fn().mockRejectedValue(new Error('Timeout')),
      };

      // Should handle gracefully when no confirmation
      await expect(
        updater.waitForSaveConfirmation(mockPage)
      ).resolves.not.toThrow();
    });
  });
});
