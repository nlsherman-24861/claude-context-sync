import { chromium } from 'playwright';
import { join } from 'path';
import { homedir } from 'os';
import { writeJson, readJson, fileExists, ensureDir, chmod } from '../utils/fs.js';
import { info, success, warn, error as logError } from '../utils/logger.js';

/**
 * Manages Claude Chat browser sessions for automation
 * Handles authentication capture, persistence, and validation
 */
export class SessionManager {
  constructor() {
    this.configDir = join(homedir(), '.config', 'claude');
    this.sessionPath = join(this.configDir, 'session.json');
  }

  /**
   * Capture a new authenticated session using headed browser
   * User must manually log in during this process
   */
  async captureSession() {
    try {
      // Ensure config directory exists
      await ensureDir(this.configDir);

      const browser = await chromium.launch({
        headless: false,  // Must be headed for login
        timeout: 120000,   // 2 minute timeout for browser launch
        args: [
          '--disable-blink-features=AutomationControlled'
        ]
      });

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
        locale: 'en-US',
        timezoneId: 'America/New_York'
      });
      const page = await context.newPage();

      info('Opening Claude Chat...');
      await page.goto('https://claude.ai');

      info('Please log in to Claude...');
      info('If you receive an email verification link, paste it into the Playwright browser.');
      info('Waiting for authentication...');

      // Monitor ALL pages in context for authentication success
      const waitForAuthOnAnyPage = async () => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Authentication timeout after 5 minutes')), 300000);

          // Check existing page
          const checkAuth = async (pageToCheck) => {
            try {
              await Promise.race([
                pageToCheck.waitForURL('**/chat/**', { timeout: 5000 }).then(() => true),
                pageToCheck.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 }).then(() => true),
                pageToCheck.waitForSelector('text=New chat', { timeout: 5000 }).then(() => true)
              ]).then(() => {
                clearTimeout(timeout);
                resolve(pageToCheck);
              }).catch(() => {}); // Ignore individual check failures
            } catch (e) {
              // Keep trying
            }
          };

          // Monitor current page
          const checkInterval = setInterval(() => checkAuth(page), 1000);

          // Listen for new pages (e.g., from email verification links)
          context.on('page', async (newPage) => {
            info('New tab detected - monitoring for authentication...');
            const newPageCheckInterval = setInterval(() => checkAuth(newPage), 1000);

            newPage.on('close', () => {
              clearInterval(newPageCheckInterval);
            });
          });

          // Cleanup
          context.on('close', () => {
            clearInterval(checkInterval);
            clearTimeout(timeout);
            reject(new Error('Browser closed before authentication'));
          });
        });
      };

      await waitForAuthOnAnyPage();

      success('Authentication detected!');

      // Save session state
      const sessionData = await context.storageState();
      await this.saveSession(sessionData);

      await browser.close();

      success('Session captured successfully!');
      return true;
    } catch (err) {
      throw new Error(`Session capture failed: ${err.message}`);
    }
  }

  /**
   * Save session data with metadata and proper permissions
   */
  async saveSession(sessionData) {
    const metadata = {
      capturedAt: new Date().toISOString(),
      lastValidated: new Date().toISOString(),
      version: '1.0'
    };

    const fullSession = {
      ...sessionData,
      metadata
    };

    await writeJson(this.sessionPath, fullSession);
    await chmod(this.sessionPath, 0o600); // Owner read/write only

    info(`Session saved to: ${this.sessionPath}`);
  }

  /**
   * Load existing session from disk
   */
  async loadSession() {
    if (!await fileExists(this.sessionPath)) {
      throw new Error('No session found. Run: claude-context-sync setup --authenticate');
    }

    const session = await readJson(this.sessionPath);
    
    // Validate session format
    if (!session.metadata || !session.cookies) {
      throw new Error('Invalid session format. Please re-authenticate.');
    }

    return session;
  }

  /**
   * Validate current session by testing it against Claude Chat
   */
  async validateSession() {
    try {
      const session = await this.loadSession();

      // Check session age
      const capturedAt = new Date(session.metadata.capturedAt);
      const ageInDays = (Date.now() - capturedAt) / (1000 * 60 * 60 * 24);

      if (ageInDays > 30) {
        warn(`Session is ${Math.floor(ageInDays)} days old`);
      }

      // Test session by loading Claude headlessly
      const browser = await chromium.launch({ headless: true });
      
      try {
        const context = await browser.newContext({
          storageState: session
        });

        const page = await context.newPage();

        // Navigate to Claude with timeout
        await page.goto('https://claude.ai', { timeout: 30000 });

        // Check if we're logged in by looking for authenticated elements
        const isLoggedIn = await Promise.race([
          page.locator('[data-testid="user-menu"]').isVisible({ timeout: 10000 }).then(() => true),
          page.locator('text=New chat').isVisible({ timeout: 10000 }).then(() => true),
          page.locator('[data-testid="chat-input"]').isVisible({ timeout: 10000 }).then(() => true),
          page.waitForTimeout(10000).then(() => false) // Fallback timeout
        ]);

        await browser.close();

        if (!isLoggedIn) {
          return {
            valid: false,
            reason: 'Session expired or invalid - login elements not found'
          };
        }

        // Update last validated timestamp
        session.metadata.lastValidated = new Date().toISOString();
        await this.saveSession(session);

        return {
          valid: true,
          capturedAt: session.metadata.capturedAt,
          lastValidated: session.metadata.lastValidated,
          ageInDays: Math.floor(ageInDays)
        };
      } catch (browserError) {
        await browser.close();
        throw browserError;
      }
    } catch (err) {
      return {
        valid: false,
        reason: err.message
      };
    }
  }

  /**
   * Get session age in days
   */
  getSessionAge(session) {
    const capturedAt = new Date(session.metadata.capturedAt);
    return (Date.now() - capturedAt) / (1000 * 60 * 60 * 24);
  }

  /**
   * Check if session is considered old
   */
  isSessionOld(session, maxDays = 30) {
    return this.getSessionAge(session) > maxDays;
  }

  /**
   * Refresh existing session (re-capture)
   */
  async refreshSession() {
    info('Refreshing Claude Chat session...');
    return await this.captureSession();
  }

  /**
   * Get session info without validation
   */
  async getSessionInfo() {
    const session = await this.loadSession();
    
    return {
      capturedAt: session.metadata.capturedAt,
      lastValidated: session.metadata.lastValidated,
      cookieCount: session.cookies?.length || 0,
      originsCount: session.origins?.length || 0,
      ageInDays: Math.floor(this.getSessionAge(session))
    };
  }

  /**
   * Check if session file exists
   */
  async hasSession() {
    return await fileExists(this.sessionPath);
  }
}