import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupAuthenticate, setupRefreshSession, setupBrowser } from '../../src/commands/setup.js';

// Mock the SessionManager
vi.mock('../../src/browser/session-manager.js', () => ({
  SessionManager: vi.fn(() => ({
    captureSession: vi.fn(),
    validateSession: vi.fn(),
    hasSession: vi.fn()
  }))
}));

// Mock the logger
vi.mock('../../src/utils/logger.js', () => ({
  info: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}));

describe('Setup Commands', () => {
  let mockSessionManager;
  let mockLogger;
  let mockExit;

  beforeEach(async () => {
    mockSessionManager = {
      captureSession: vi.fn(),
      validateSession: vi.fn(),
      hasSession: vi.fn()
    };

    const { SessionManager } = vi.mocked(await import('../../src/browser/session-manager.js'));
    SessionManager.mockReturnValue(mockSessionManager);

    mockLogger = vi.mocked(await import('../../src/utils/logger.js'));

    vi.clearAllMocks();

    // Mock process.exit to prevent actual exits in tests
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setupAuthenticate', () => {
    it('should successfully capture and validate session', async () => {
      mockSessionManager.captureSession.mockResolvedValue(true);
      mockSessionManager.validateSession.mockResolvedValue({
        valid: true,
        ageInDays: 0
      });

      await setupAuthenticate();

      expect(mockSessionManager.captureSession).toHaveBeenCalledOnce();
      expect(mockSessionManager.validateSession).toHaveBeenCalledOnce();
      expect(mockLogger.success).toHaveBeenCalledWith('Authentication complete!');
      expect(mockLogger.success).toHaveBeenCalledWith('Session validated successfully!');
    });

    it('should handle capture failure', async () => {
      mockSessionManager.captureSession.mockRejectedValue(new Error('Browser timeout'));

      await expect(setupAuthenticate()).rejects.toThrow('process.exit called');

      expect(mockLogger.error).toHaveBeenCalledWith('Setup failed: Browser timeout');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle validation failure after successful capture', async () => {
      mockSessionManager.captureSession.mockResolvedValue(true);
      mockSessionManager.validateSession.mockResolvedValue({
        valid: false,
        reason: 'Session expired'
      });

      await setupAuthenticate();

      expect(mockLogger.error).toHaveBeenCalledWith('Validation failed: Session expired');
    });

    it('should provide timeout help message', async () => {
      mockSessionManager.captureSession.mockRejectedValue(new Error('timeout occurred'));

      await expect(setupAuthenticate()).rejects.toThrow('process.exit called');

      expect(mockLogger.info).toHaveBeenCalledWith('Try: Ensure you complete login within 5 minutes');
    });
  });

  describe('setupRefreshSession', () => {
    it('should refresh existing session', async () => {
      mockSessionManager.hasSession.mockResolvedValue(true);
      mockSessionManager.captureSession.mockResolvedValue(true);

      await setupRefreshSession();

      expect(mockSessionManager.captureSession).toHaveBeenCalledOnce();
      expect(mockLogger.success).toHaveBeenCalledWith('Session refreshed successfully!');
    });

    it('should warn if no existing session', async () => {
      mockSessionManager.hasSession.mockResolvedValue(false);

      await setupRefreshSession();

      expect(mockLogger.warn).toHaveBeenCalledWith('No existing session found.');
      expect(mockLogger.info).toHaveBeenCalledWith('Use: claude-context-sync setup --authenticate');
      expect(mockSessionManager.captureSession).not.toHaveBeenCalled();
    });

    it('should handle refresh failure', async () => {
      mockSessionManager.hasSession.mockResolvedValue(true);
      mockSessionManager.captureSession.mockRejectedValue(new Error('Network error'));

      await expect(setupRefreshSession()).rejects.toThrow('process.exit called');

      expect(mockLogger.error).toHaveBeenCalledWith('Refresh failed: Network error');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('setupBrowser', () => {
    it('should succeed when browser is available', async () => {
      // Mock playwright import and browser launch
      const mockBrowser = { close: vi.fn() };
      const mockChromium = { launch: vi.fn().mockResolvedValue(mockBrowser) };
      
      vi.doMock('playwright', () => ({ chromium: mockChromium }));

      await setupBrowser();

      expect(mockLogger.success).toHaveBeenCalledWith('Browser environment is ready!');
    });

    it('should handle browser unavailable', async () => {
      // Mock playwright import with browser launch failure
      const mockChromium = { 
        launch: vi.fn().mockRejectedValue(new Error('Browser not found')) 
      };
      
      vi.doMock('playwright', () => ({ chromium: mockChromium }));

      await expect(setupBrowser()).rejects.toThrow('process.exit called');

      expect(mockLogger.error).toHaveBeenCalledWith('Browser setup failed: Browser not found');
      expect(mockLogger.info).toHaveBeenCalledWith('Manual setup: npx playwright install --with-deps chromium');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
});