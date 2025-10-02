import { describe, it, expect } from 'vitest';
import { 
  detectAvailableShells, 
  getInstallationPaths, 
  isInPath,
  getPlatform 
} from '../src/utils/platform.js';

describe('Platform Utilities', () => {
  it('should detect current platform', () => {
    const platform = getPlatform();
    expect(typeof platform).toBe('string');
    expect(['win32', 'darwin', 'linux', 'freebsd'].includes(platform)).toBe(true);
  });

  it('should return installation paths for bash', () => {
    const paths = getInstallationPaths('bash');
    expect(Array.isArray(paths)).toBe(true);
    expect(paths.length).toBeGreaterThan(0);
  });

  it('should return installation paths for powershell', () => {
    const paths = getInstallationPaths('powershell');
    expect(Array.isArray(paths)).toBe(true);
  });

  it('should return installation paths for cmd', () => {
    const paths = getInstallationPaths('cmd');
    expect(Array.isArray(paths)).toBe(true);
  });

  it('should handle invalid shell gracefully', () => {
    const paths = getInstallationPaths('invalid-shell');
    expect(Array.isArray(paths)).toBe(true);
    expect(paths.length).toBe(0);
  });
});

describe('Shell Detection', () => {
  it('should detect available shells', async () => {
    // This test may vary based on the environment
    const shells = await detectAvailableShells();
    expect(Array.isArray(shells)).toBe(true);
    // On Linux CI, we should at least have bash
    expect(shells.length).toBeGreaterThan(0);
  });
});

describe('PATH Detection', () => {
  it('should check if /usr/bin is in PATH', async () => {
    // /usr/bin should be in PATH on most Unix systems
    const inPath = await isInPath('/usr/bin');
    expect(typeof inPath).toBe('boolean');
  });

  it('should return false for non-existent path', async () => {
    const inPath = await isInPath('/non/existent/path/that/should/not/exist');
    expect(inPath).toBe(false);
  });
});