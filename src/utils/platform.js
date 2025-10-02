import { platform, homedir } from 'os';
import { join, sep } from 'path';
import { promises as fs } from 'fs';
import { fileExists } from './fs.js';

/**
 * Cross-platform utilities for path handling and shell detection
 */

export function getPlatform() {
  return platform();
}

export function isWindows() {
  return platform() === 'win32';
}

export function isMacOS() {
  return platform() === 'darwin';
}

export function isLinux() {
  return platform() === 'linux';
}

/**
 * Get user's home directory with proper cross-platform handling
 */
export function getHomeDirectory() {
  return homedir();
}

/**
 * Get platform-appropriate configuration directory
 */
export function getConfigDirectory() {
  const home = getHomeDirectory();
  
  if (isWindows()) {
    return process.env.APPDATA || join(home, 'AppData', 'Roaming');
  } else {
    return process.env.XDG_CONFIG_HOME || join(home, '.config');
  }
}

/**
 * Detect available shells on the current platform
 */
export async function detectAvailableShells() {
  const shells = [];
  
  if (isWindows()) {
    // Check for PowerShell
    if (await commandExists('powershell') || await commandExists('pwsh')) {
      shells.push('powershell');
    }
    
    // CMD is always available on Windows
    shells.push('cmd');
    
    // Check for Git Bash
    if (await commandExists('bash')) {
      shells.push('bash');
    }
  } else {
    // Unix-like systems
    if (await commandExists('bash')) {
      shells.push('bash');
    }
    
    if (await commandExists('zsh')) {
      shells.push('zsh');
    }
  }
  
  return shells;
}

/**
 * Check if a command exists in PATH
 */
async function commandExists(command) {
  try {
    const { spawn } = await import('child_process');
    const testCommand = isWindows() ? 'where' : 'which';
    
    return new Promise((resolve) => {
      const child = spawn(testCommand, [command], { 
        stdio: 'ignore',
        shell: true 
      });
      
      child.on('close', (code) => {
        resolve(code === 0);
      });
      
      child.on('error', () => {
        resolve(false);
      });
    });
  } catch {
    return false;
  }
}

/**
 * Get appropriate installation directories for wrappers
 */
export function getInstallationPaths(shell) {
  const home = getHomeDirectory();
  
  if (shell === 'bash' || shell === 'zsh') {
    return [
      join(home, '.local', 'bin'),
      join(home, 'bin'),
      ...(isMacOS() ? ['/usr/local/bin'] : []),
      ...(isLinux() ? ['/usr/local/bin'] : [])
    ];
  }
  
  if (shell === 'powershell') {
    const documentsPath = isWindows() 
      ? join(home, 'Documents') 
      : join(home, 'Documents');
    
    return [
      join(documentsPath, 'PowerShell', 'Scripts'),
      join(documentsPath, 'WindowsPowerShell', 'Scripts')
    ];
  }
  
  if (shell === 'cmd') {
    return [
      join(home, 'bin'),
      ...(isWindows() ? [
        join(process.env.USERPROFILE || home, 'bin'),
        'C:\\Users\\' + (process.env.USERNAME || 'user') + '\\bin'
      ] : [])
    ];
  }
  
  return [];
}

/**
 * Check if a directory is in the user's PATH
 */
export async function isInPath(directory) {
  const pathEnv = process.env.PATH || '';
  const pathSeparator = isWindows() ? ';' : ':';
  const paths = pathEnv.split(pathSeparator);
  
  // Normalize paths for comparison
  const normalizedDir = directory.replace(/[/\\]/g, sep);
  
  return paths.some(path => {
    const normalizedPath = path.replace(/[/\\]/g, sep);
    return normalizedPath === normalizedDir;
  });
}

/**
 * Get shell profile files for adding to PATH
 */
export function getShellProfiles(shell) {
  const home = getHomeDirectory();
  
  const profiles = {
    bash: [
      join(home, '.bashrc'),
      join(home, '.bash_profile'),
      join(home, '.profile')
    ],
    zsh: [
      join(home, '.zshrc'),
      join(home, '.zprofile'),
      join(home, '.profile')
    ],
    powershell: [
      // PowerShell profile paths are more complex and handled separately
    ]
  };
  
  return profiles[shell] || [];
}

/**
 * Get PowerShell profile path
 */
export async function getPowerShellProfile() {
  try {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const child = spawn('powershell', [
        '-NoProfile', 
        '-Command', 
        'Write-Host $PROFILE'
      ], { stdio: 'pipe' });
      
      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error('Failed to get PowerShell profile path'));
        }
      });
      
      child.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Failed to get PowerShell profile: ${error.message}`);
  }
}

/**
 * Expand tilde (~) in paths to user home directory
 */
export function expandTilde(path) {
  if (path.startsWith('~/') || path === '~') {
    return path.replace(/^~/, getHomeDirectory());
  }
  return path;
}