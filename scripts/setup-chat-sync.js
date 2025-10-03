#!/usr/bin/env node

/**
 * Interactive setup script for Claude Chat sync
 * Handles dependency checks, Playwright installation, and session capture
 */

import { spawn } from 'child_process';
import { SessionManager } from '../src/browser/session-manager.js';
import { info, success, error, warn } from '../src/utils/logger.js';

async function checkPlaywright() {
  try {
    await import('playwright');
    success('✓ Playwright is installed');
    return true;
  } catch {
    warn('✗ Playwright not found');
    return false;
  }
}

async function installPlaywright() {
  info('Installing Playwright...');
  return new Promise((resolve, reject) => {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const install = spawn(npm, ['install', 'playwright'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    install.on('close', (code) => {
      if (code === 0) {
        success('✓ Playwright installed');
        resolve(true);
      } else {
        reject(new Error(`npm install failed with code ${code}`));
      }
    });
  });
}

async function installBrowsers() {
  info('Installing Playwright browsers (chromium)...');
  info('This may take a few minutes...');
  
  return new Promise((resolve, reject) => {
    const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const install = spawn(npx, ['playwright', 'install', 'chromium'], {
      stdio: 'inherit'
    });

    install.on('close', (code) => {
      if (code === 0) {
        success('✓ Chromium installed');
        resolve(true);
      } else {
        reject(new Error(`Browser install failed with code ${code}`));
      }
    });
  });
}

async function captureSession() {
  info('
=== Session Capture ===');
  info('A browser window will open for you to log in to Claude.');
  info('After logging in, the session will be saved automatically.');
  info('
Press Ctrl+C to cancel, or press Enter to continue...');

  // Wait for user confirmation
  await new Promise((resolve) => {
    process.stdin.once('data', resolve);
  });

  const manager = new SessionManager();
  
  try {
    await manager.captureSession();
    success('
✓ Session captured successfully!');
    return true;
  } catch (err) {
    error(`Session capture failed: ${err.message}`);
    return false;
  }
}

async function checkExistingSession() {
  const manager = new SessionManager();
  
  if (await manager.hasSession()) {
    info('Found existing session');
    const validation = await manager.validateSession();
    
    if (validation.valid) {
      success(`✓ Session is valid (captured ${validation.ageInDays} days ago)`);
      return true;
    } else {
      warn(`✗ Session is invalid: ${validation.reason}`);
      return false;
    }
  }
  
  return false;
}

async function main() {
  console.log('
=== Claude Chat Sync Setup ===
');

  // Step 1: Check Playwright
  info('Step 1: Checking dependencies...');
  const hasPlaywright = await checkPlaywright();
  
  if (!hasPlaywright) {
    try {
      await installPlaywright();
    } catch (err) {
      error(`Failed to install Playwright: ${err.message}`);
      process.exit(1);
    }
  }

  // Step 2: Install browsers
  info('
Step 2: Checking Playwright browsers...');
  try {
    await installBrowsers();
  } catch (err) {
    error(`Failed to install browsers: ${err.message}`);
    process.exit(1);
  }

  // Step 3: Check/capture session
  info('
Step 3: Checking Claude Chat session...');
  const hasValidSession = await checkExistingSession();
  
  if (!hasValidSession) {
    info('Need to capture a new session');
    const captured = await captureSession();
    
    if (!captured) {
      error('Setup incomplete - session capture failed');
      process.exit(1);
    }
  }

  // Done!
  success('
✓ Chat sync setup complete!
');
  info('You can now run: claude-context-sync sync --target chat');
  info('Or sync everything: claude-context-sync sync --target all
');
}

main().catch((err) => {
  error(`Setup failed: ${err.message}`);
  process.exit(1);
});
