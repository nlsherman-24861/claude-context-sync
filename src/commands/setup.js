import { SessionManager } from '../browser/session-manager.js';
import { success, error, info, warn } from '../utils/logger.js';

/**
 * Setup command for authentication and session management
 */
export async function setupAuthenticate() {
  try {
    const manager = new SessionManager();
    
    info('This will open a browser window for you to log in to Claude.');
    info('The browser window will close automatically after successful login.');
    warn('Please ensure you have a GUI environment available for the browser window.');
    
    await manager.captureSession();
    
    success('Authentication complete!');
    success('Session saved for future use.');
    
    // Validate immediately
    info('Validating session...');
    const validation = await manager.validateSession();
    
    if (validation.valid) {
      success('Session validated successfully!');
      info(`Session age: ${validation.ageInDays} days`);
    } else {
      error(`Validation failed: ${validation.reason}`);
      info('You may need to try authentication again.');
    }
  } catch (err) {
    error(`Setup failed: ${err.message}`);
    
    // Provide helpful error messages based on common issues
    if (err.message.includes('timeout')) {
      info('Try: Ensure you complete login within 5 minutes');
    } else if (err.message.includes('browser')) {
      info('Try: Ensure you have a GUI environment and browser support');
    }
    
    process.exit(1);
  }
}

/**
 * Refresh existing session
 */
export async function setupRefreshSession() {
  try {
    const manager = new SessionManager();
    
    // Check if session exists first
    if (!await manager.hasSession()) {
      warn('No existing session found.');
      info('Use: claude-context-sync setup --authenticate');
      return;
    }
    
    info('Refreshing Claude Chat session...');
    await manager.captureSession();
    
    success('Session refreshed successfully!');
  } catch (err) {
    error(`Refresh failed: ${err.message}`);
    
    if (err.message.includes('timeout')) {
      info('Try: Ensure you complete login within 5 minutes');
    }
    
    process.exit(1);
  }
}

/**
 * Setup browser environment (install Playwright browsers)
 */
export async function setupBrowser() {
  try {
    info('Setting up browser environment...');
    info('This will install required browser binaries.');
    
    // Note: In production, this would run: npx playwright install --with-deps chromium
    // For now, we'll just check if the browser is available
    const { chromium } = await import('playwright');
    
    try {
      const browser = await chromium.launch({ headless: true });
      await browser.close();
      success('Browser environment is ready!');
    } catch (browserErr) {
      error('Browser not available. Please run: npx playwright install --with-deps chromium');
      throw browserErr;
    }
  } catch (err) {
    error(`Browser setup failed: ${err.message}`);
    info('Manual setup: npx playwright install --with-deps chromium');
    process.exit(1);
  }
}