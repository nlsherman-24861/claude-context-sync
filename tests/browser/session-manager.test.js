import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { SessionManager } from '../../src/browser/session-manager.js';

// Mock the file system utilities
vi.mock('../../src/utils/fs.js', () => ({
  writeJson: vi.fn(),
  readJson: vi.fn(),
  fileExists: vi.fn(),
  ensureDir: vi.fn(),
  chmod: vi.fn()
}));

// Mock the logger
vi.mock('../../src/utils/logger.js', () => ({
  info: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}));

// Mock Playwright
vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(() => ({
      newContext: vi.fn(() => ({
        newPage: vi.fn(() => ({
          goto: vi.fn(),
          waitForURL: vi.fn(),
          waitForSelector: vi.fn(),
          locator: vi.fn(() => ({
            or: vi.fn(() => ({
              isVisible: vi.fn()
            })),
            isVisible: vi.fn()
          })),
          waitForTimeout: vi.fn()
        })),
        storageState: vi.fn(() => ({
          cookies: [{ name: 'test', value: 'cookie' }],
          origins: [{ origin: 'https://claude.ai', localStorage: [] }]
        }))
      })),
      close: vi.fn()
    }))
  }
}));

describe('SessionManager', () => {
  let sessionManager;
  let mockFs;
  let mockLogger;

  beforeEach(() => {
    sessionManager = new SessionManager();
    mockFs = vi.hoisted(() => ({}));
    mockLogger = vi.hoisted(() => ({}));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct paths', () => {
      expect(sessionManager.configDir).toMatch(/\.config[/\\]claude$/);
      expect(sessionManager.sessionPath).toMatch(/\.config[/\\]claude[/\\]session\.json$/);
    });
  });

  describe('getSessionAge', () => {
    it('should calculate session age correctly', () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const session = {
        metadata: {
          capturedAt: fiveDaysAgo.toISOString()
        }
      };
      
      const ageInDays = sessionManager.getSessionAge(session);
      expect(ageInDays).toBeGreaterThan(4);
      expect(ageInDays).toBeLessThan(6);
    });

    it('should handle fresh sessions', () => {
      const now = new Date();
      const session = {
        metadata: {
          capturedAt: now.toISOString()
        }
      };
      
      const ageInDays = sessionManager.getSessionAge(session);
      expect(ageInDays).toBeLessThan(1);
    });
  });

  describe('isSessionOld', () => {
    it('should detect old sessions with default threshold', () => {
      const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
      const session = {
        metadata: {
          capturedAt: fortyDaysAgo.toISOString()
        }
      };
      
      const isOld = sessionManager.isSessionOld(session);
      expect(isOld).toBe(true);
    });

    it('should not flag recent sessions as old', () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const session = {
        metadata: {
          capturedAt: fiveDaysAgo.toISOString()
        }
      };
      
      const isOld = sessionManager.isSessionOld(session);
      expect(isOld).toBe(false);
    });

    it('should use custom threshold', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const session = {
        metadata: {
          capturedAt: tenDaysAgo.toISOString()
        }
      };
      
      const isOld = sessionManager.isSessionOld(session, 7);
      expect(isOld).toBe(true);
    });
  });

  describe('saveSession', () => {
    it('should save session with metadata and proper permissions', async () => {
      const { writeJson, chmod } = await import('../../src/utils/fs.js');
      
      const sessionData = {
        cookies: [{ name: 'test', value: 'cookie' }],
        origins: []
      };

      await sessionManager.saveSession(sessionData);

      expect(writeJson).toHaveBeenCalledWith(
        sessionManager.sessionPath,
        expect.objectContaining({
          ...sessionData,
          metadata: expect.objectContaining({
            capturedAt: expect.any(String),
            lastValidated: expect.any(String),
            version: '1.0'
          })
        })
      );

      expect(chmod).toHaveBeenCalledWith(sessionManager.sessionPath, 0o600);
    });
  });

  describe('loadSession', () => {
    it('should throw error if session file does not exist', async () => {
      const { fileExists } = await import('../../src/utils/fs.js');
      fileExists.mockResolvedValue(false);

      await expect(sessionManager.loadSession()).rejects.toThrow(
        'No session found. Run: claude-context-sync setup --authenticate'
      );
    });

    it('should throw error for invalid session format', async () => {
      const { fileExists, readJson } = await import('../../src/utils/fs.js');
      fileExists.mockResolvedValue(true);
      readJson.mockResolvedValue({ invalid: 'session' });

      await expect(sessionManager.loadSession()).rejects.toThrow(
        'Invalid session format. Please re-authenticate.'
      );
    });

    it('should load valid session successfully', async () => {
      const { fileExists, readJson } = await import('../../src/utils/fs.js');
      const validSession = {
        cookies: [{ name: 'test', value: 'cookie' }],
        metadata: { capturedAt: new Date().toISOString() }
      };

      fileExists.mockResolvedValue(true);
      readJson.mockResolvedValue(validSession);

      const result = await sessionManager.loadSession();
      expect(result).toEqual(validSession);
    });
  });

  describe('hasSession', () => {
    it('should return true if session exists', async () => {
      const { fileExists } = await import('../../src/utils/fs.js');
      fileExists.mockResolvedValue(true);

      const result = await sessionManager.hasSession();
      expect(result).toBe(true);
    });

    it('should return false if session does not exist', async () => {
      const { fileExists } = await import('../../src/utils/fs.js');
      fileExists.mockResolvedValue(false);

      const result = await sessionManager.hasSession();
      expect(result).toBe(false);
    });
  });

  describe('getSessionInfo', () => {
    it('should return session information', async () => {
      const { fileExists, readJson } = await import('../../src/utils/fs.js');
      const session = {
        cookies: [{ name: 'test1' }, { name: 'test2' }],
        origins: [{ origin: 'https://claude.ai' }],
        metadata: {
          capturedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          lastValidated: new Date().toISOString()
        }
      };

      fileExists.mockResolvedValue(true);
      readJson.mockResolvedValue(session);

      const info = await sessionManager.getSessionInfo();

      expect(info).toEqual({
        capturedAt: session.metadata.capturedAt,
        lastValidated: session.metadata.lastValidated,
        cookieCount: 2,
        originsCount: 1,
        ageInDays: expect.any(Number)
      });

      expect(info.ageInDays).toBeGreaterThan(1);
      expect(info.ageInDays).toBeLessThan(3);
    });
  });
});