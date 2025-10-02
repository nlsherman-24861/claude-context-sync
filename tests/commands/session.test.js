import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sessionCheck, sessionInfo, sessionClear } from '../../src/commands/session.js';

// Mock the SessionManager
vi.mock('../../src/browser/session-manager.js', () => ({
  SessionManager: vi.fn(() => ({
    validateSession: vi.fn(),
    hasSession: vi.fn(),
    getSessionInfo: vi.fn()
  }))
}));

// Mock the logger
vi.mock('../../src/utils/logger.js', () => ({
  info: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}));

// Mock console.log to capture session info output
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

// Mock process.exit to prevent actual exits in tests
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

describe('Session Commands', () => {
  let mockSessionManager;
  let mockLogger;

  beforeEach(() => {
    mockSessionManager = {
      validateSession: vi.fn(),
      hasSession: vi.fn(),
      getSessionInfo: vi.fn()
    };

    const { SessionManager } = vi.mocked(await import('../../src/browser/session-manager.js'));
    SessionManager.mockReturnValue(mockSessionManager);

    mockLogger = vi.mocked(await import('../../src/utils/logger.js'));
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('sessionCheck', () => {
    it('should report valid session', async () => {
      mockSessionManager.validateSession.mockResolvedValue({
        valid: true,
        capturedAt: '2025-10-01T10:00:00.000Z',
        lastValidated: '2025-10-02T15:00:00.000Z',
        ageInDays: 1
      });

      await sessionCheck();

      expect(mockLogger.success).toHaveBeenCalledWith('Session is valid!');
      expect(mockLogger.info).toHaveBeenCalledWith('Captured: 2025-10-01T10:00:00.000Z');
      expect(mockLogger.info).toHaveBeenCalledWith('Last validated: 2025-10-02T15:00:00.000Z');
      expect(mockLogger.info).toHaveBeenCalledWith('Age: 1 days');
    });

    it('should warn about old sessions', async () => {
      mockSessionManager.validateSession.mockResolvedValue({
        valid: true,
        capturedAt: '2025-09-01T10:00:00.000Z',
        lastValidated: '2025-10-02T15:00:00.000Z',
        ageInDays: 31
      });

      await sessionCheck();

      expect(mockLogger.success).toHaveBeenCalledWith('Session is valid!');
      expect(mockLogger.warn).toHaveBeenCalledWith('Session is getting old. Consider refreshing soon.');
    });

    it('should handle invalid session and exit', async () => {
      mockSessionManager.validateSession.mockResolvedValue({
        valid: false,
        reason: 'Session expired'
      });

      await expect(sessionCheck()).rejects.toThrow('process.exit called');

      expect(mockLogger.error).toHaveBeenCalledWith('Session invalid: Session expired');
      expect(mockLogger.info).toHaveBeenCalledWith('To fix this, run: claude-context-sync setup --refresh-session');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle session check failure', async () => {
      mockSessionManager.validateSession.mockRejectedValue(new Error('No session found'));

      await expect(sessionCheck()).rejects.toThrow('process.exit called');

      expect(mockLogger.error).toHaveBeenCalledWith('Session check failed: No session found');
      expect(mockLogger.info).toHaveBeenCalledWith('To create a session, run: claude-context-sync setup --authenticate');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('sessionInfo', () => {
    it('should display session information when session exists', async () => {
      mockSessionManager.hasSession.mockResolvedValue(true);
      mockSessionManager.getSessionInfo.mockResolvedValue({
        capturedAt: '2025-10-01T10:00:00.000Z',
        lastValidated: '2025-10-02T15:00:00.000Z',
        ageInDays: 1,
        cookieCount: 5,
        originsCount: 2
      });

      await sessionInfo();

      expect(mockConsoleLog).toHaveBeenCalledWith('Session Information:');
      expect(mockConsoleLog).toHaveBeenCalledWith('  Captured: 2025-10-01T10:00:00.000Z');
      expect(mockConsoleLog).toHaveBeenCalledWith('  Last Validated: 2025-10-02T15:00:00.000Z');
      expect(mockConsoleLog).toHaveBeenCalledWith('  Age: 1 days');
      expect(mockConsoleLog).toHaveBeenCalledWith('  Cookies: 5');
      expect(mockConsoleLog).toHaveBeenCalledWith('  Origins: 2');
      expect(mockLogger.success).toHaveBeenCalledWith('  Status: Session is fresh');
    });

    it('should warn about old sessions', async () => {
      mockSessionManager.hasSession.mockResolvedValue(true);
      mockSessionManager.getSessionInfo.mockResolvedValue({
        capturedAt: '2025-09-01T10:00:00.000Z',
        lastValidated: '2025-10-02T15:00:00.000Z',
        ageInDays: 31,
        cookieCount: 3,
        originsCount: 1
      });

      await sessionInfo();

      expect(mockLogger.warn).toHaveBeenCalledWith('  Status: Session is old, consider refreshing');
    });

    it('should show aging status for moderately old sessions', async () => {
      mockSessionManager.hasSession.mockResolvedValue(true);
      mockSessionManager.getSessionInfo.mockResolvedValue({
        capturedAt: '2025-09-25T10:00:00.000Z',
        lastValidated: '2025-10-02T15:00:00.000Z',
        ageInDays: 7,
        cookieCount: 3,
        originsCount: 1
      });

      await sessionInfo();

      expect(mockLogger.info).toHaveBeenCalledWith('  Status: Session is aging but still good');
    });

    it('should handle no session found', async () => {
      mockSessionManager.hasSession.mockResolvedValue(false);

      await sessionInfo();

      expect(mockLogger.warn).toHaveBeenCalledWith('No session found.');
      expect(mockLogger.info).toHaveBeenCalledWith('To create a session, run: claude-context-sync setup --authenticate');
      expect(mockSessionManager.getSessionInfo).not.toHaveBeenCalled();
    });

    it('should handle session info load failure', async () => {
      mockSessionManager.hasSession.mockResolvedValue(true);
      mockSessionManager.getSessionInfo.mockRejectedValue(new Error('File corrupted'));

      await expect(sessionInfo()).rejects.toThrow('process.exit called');

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to load session info: File corrupted');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('sessionClear', () => {
    it('should inform about manual clearing when session exists', async () => {
      mockSessionManager.hasSession.mockResolvedValue(true);

      await sessionClear();

      expect(mockLogger.warn).toHaveBeenCalledWith('Session clearing not yet implemented.');
      expect(mockLogger.info).toHaveBeenCalledWith('Manual removal: rm ~/.config/claude/session.json');
    });

    it('should handle no session to clear', async () => {
      mockSessionManager.hasSession.mockResolvedValue(false);

      await sessionClear();

      expect(mockLogger.info).toHaveBeenCalledWith('No session to clear.');
    });

    it('should handle clear operation failure', async () => {
      mockSessionManager.hasSession.mockRejectedValue(new Error('Access denied'));

      await expect(sessionClear()).rejects.toThrow('process.exit called');

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to clear session: Access denied');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
});