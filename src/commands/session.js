import { SessionManager } from '../browser/session-manager.js';
import { success, error, info, warn } from '../utils/logger.js';

/**
 * Session validation command
 */
export async function sessionCheck() {
  try {
    const manager = new SessionManager();
    
    info('Validating session...');
    const result = await manager.validateSession();
    
    if (result.valid) {
      success('Session is valid!');
      info(`Captured: ${result.capturedAt}`);
      info(`Last validated: ${result.lastValidated}`);
      info(`Age: ${result.ageInDays} days`);
      
      if (result.ageInDays > 30) {
        warn('Session is getting old. Consider refreshing soon.');
      }
    } else {
      error(`Session invalid: ${result.reason}`);
      info('To fix this, run: claude-context-sync setup --refresh-session');
      process.exit(1);
    }
  } catch (err) {
    error(`Session check failed: ${err.message}`);
    
    if (err.message.includes('No session found')) {
      info('To create a session, run: claude-context-sync setup --authenticate');
    }
    
    process.exit(1);
  }
}

/**
 * Display session information
 */
export async function sessionInfo() {
  try {
    const manager = new SessionManager();
    
    if (!await manager.hasSession()) {
      warn('No session found.');
      info('To create a session, run: claude-context-sync setup --authenticate');
      return;
    }
    
    const sessionInfo = await manager.getSessionInfo();
    
    console.log('Session Information:');
    console.log(`  Captured: ${sessionInfo.capturedAt}`);
    console.log(`  Last Validated: ${sessionInfo.lastValidated}`);
    console.log(`  Age: ${sessionInfo.ageInDays} days`);
    console.log(`  Cookies: ${sessionInfo.cookieCount}`);
    console.log(`  Origins: ${sessionInfo.originsCount}`);
    
    if (sessionInfo.ageInDays > 30) {
      warn('  Status: Session is old, consider refreshing');
    } else if (sessionInfo.ageInDays > 7) {
      info('  Status: Session is aging but still good');
    } else {
      success('  Status: Session is fresh');
    }
  } catch (err) {
    error(`Failed to load session info: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Clear/remove session
 */
export async function sessionClear() {
  try {
    const manager = new SessionManager();
    
    if (!await manager.hasSession()) {
      info('No session to clear.');
      return;
    }
    
    // Note: We would implement actual file deletion here
    // For now, just inform the user
    warn('Session clearing not yet implemented.');
    info('Manual removal: rm ~/.config/claude/session.json');
  } catch (err) {
    error(`Failed to clear session: ${err.message}`);
    process.exit(1);
  }
}

// CLI command wrappers
export async function setupCmd(options) {
  const { SessionManager } = await import('../browser/session-manager.js');
  const manager = new SessionManager();

  if (options.authenticate || options.refreshSession) {
    await manager.captureSession();
  } else {
    info('Use: claude-context-sync setup --authenticate');
  }
}

export async function sessionCmd(options) {
  if (options.check) {
    await sessionCheck();
  } else if (options.info) {
    await sessionInfo();
  } else {
    await sessionCheck();
  }
}
