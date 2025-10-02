import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadConfig, findConfigFile, mergeWithDefaults, ConfigNotFoundError, ConfigValidationError } from '../src/config/index.js';
import { writeYaml } from '../src/utils/fs.js';

const tempDir = join(tmpdir(), 'claude-context-sync-test');

beforeEach(async () => {
  await fs.mkdir(tempDir, { recursive: true });
});

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('Config Loader', () => {
  it('should load valid config', async () => {
    const configPath = join(tempDir, 'valid-config.yaml');
    const validConfig = {
      personal: {
        name: 'Test User',
        role: 'Developer'
      },
      technical: {
        preferred_languages: ['JavaScript', 'Python']
      },
      project_defaults: {
        git_workflow: 'feature-branch'
      }
    };
    
    await writeYaml(configPath, validConfig);
    
    const { config, path } = await loadConfig(configPath);
    expect(config).toHaveProperty('personal');
    expect(config.personal.name).toBe('Test User');
    expect(path).toBe(configPath);
  });

  it('should throw ConfigNotFoundError on missing file', async () => {
    const nonexistentPath = join(tempDir, 'nonexistent.yaml');
    
    await expect(loadConfig(nonexistentPath))
      .rejects
      .toThrow(ConfigNotFoundError);
  });

  it('should throw ConfigValidationError on invalid structure', async () => {
    const configPath = join(tempDir, 'invalid-config.yaml');
    const invalidConfig = {
      // Missing required sections
      invalid: 'structure'
    };
    
    await writeYaml(configPath, invalidConfig);
    
    await expect(loadConfig(configPath))
      .rejects
      .toThrow(ConfigValidationError);
  });

  it('should merge with defaults', () => {
    const userConfig = {
      personal: {
        name: 'Test User',
        role: 'Developer'
      },
      technical: {
        preferred_languages: ['JavaScript']
      }
    };
    
    const merged = mergeWithDefaults(userConfig);
    
    expect(merged.personal.name).toBe('Test User');
    expect(merged.personal.experience_level).toBe(''); // from defaults
    expect(merged.technical.preferred_languages).toEqual(['JavaScript']);
    expect(merged.project_defaults).toBeDefined(); // from defaults
  });

  it('should find config file when custom path provided', async () => {
    const configPath = join(tempDir, 'preferences.yaml');
    const config = { personal: { name: 'Test', role: 'Dev' }, technical: {}, project_defaults: {} };
    
    await writeYaml(configPath, config);
    
    // Pass custom path directly instead of using env var
    const foundPath = await findConfigFile(configPath);
    expect(foundPath).toBe(configPath);
  });
});
