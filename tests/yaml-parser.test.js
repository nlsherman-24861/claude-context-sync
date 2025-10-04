import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  parseYamlFile,
  parseYamlString,
  stringifyYaml,
  validateBasicStructure,
  YamlParseError
} from '../src/parsers/yaml-parser.js';

const tempDir = join(tmpdir(), 'claude-context-sync-yaml-test');

beforeEach(async () => {
  await fs.mkdir(tempDir, { recursive: true });
});

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('YAML Parser', () => {
  it('should parse valid YAML file', async () => {
    const yamlPath = join(tempDir, 'valid.yaml');
    const yamlContent = `
personal:
  name: "Test User"
  role: "Developer"
technical:
  preferred_languages:
    - JavaScript
    - Python
project_defaults:
  git_workflow: "feature-branch"
`;
    
    await fs.writeFile(yamlPath, yamlContent, 'utf-8');
    
    const parsed = await parseYamlFile(yamlPath);
    expect(parsed.personal.name).toBe('Test User');
    expect(parsed.technical.preferred_languages).toEqual(['JavaScript', 'Python']);
  });

  it('should throw YamlParseError on invalid YAML file', async () => {
    const yamlPath = join(tempDir, 'invalid.yaml');
    const invalidYaml = `
personal:
  name: "Test User"
  role: "Developer"
    invalid: indentation
`;
    
    await fs.writeFile(yamlPath, invalidYaml, 'utf-8');
    
    await expect(parseYamlFile(yamlPath))
      .rejects
      .toThrow(YamlParseError);
  });

  it('should parse valid YAML string', () => {
    const yamlString = `
name: "Test"
items:
  - one
  - two
`;
    
    const parsed = parseYamlString(yamlString);
    expect(parsed.name).toBe('Test');
    expect(parsed.items).toEqual(['one', 'two']);
  });

  it('should throw YamlParseError on invalid YAML string', () => {
    const invalidYaml = `
name: "Test"
  invalid: indentation
`;
    
    expect(() => parseYamlString(invalidYaml))
      .toThrow(YamlParseError);
  });

  it('should stringify data to YAML', () => {
    const data = {
      name: 'Test',
      items: ['one', 'two'],
      nested: { key: 'value' }
    };
    
    const yaml = stringifyYaml(data);
    expect(yaml).toContain('name: Test');
    expect(yaml).toContain('- one');
    expect(yaml).toContain('- two');
    expect(yaml).toContain('key: value');
  });

  describe('validateBasicStructure', () => {
    it('should validate correct structure', () => {
      const validData = {
        personal: {
          name: 'Test User',
          role: 'Developer'
        },
        technical: {
          preferred_languages: ['JavaScript']
        },
        project_defaults: {
          git_workflow: 'feature-branch'
        }
      };
      
      const result = validateBasicStructure(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-object root', () => {
      const result = validateBasicStructure('not an object');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Root must be an object');
    });

    it('should allow missing personal section (legacy - now optional)', () => {
      const data = {
        technical: {},
        project_defaults: {}
      };

      const result = validateBasicStructure(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require name and role when personal section exists', () => {
      const data = {
        personal: {
          // Missing name and role
        },
        technical: {},
        project_defaults: {}
      };

      const result = validateBasicStructure(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: personal.name');
      expect(result.errors).toContain('Missing required field: personal.role');
    });

    it('should validate technical array fields', () => {
      const data = {
        personal: {
          name: 'Test',
          role: 'Dev'
        },
        technical: {
          preferred_languages: 'not an array'
        },
        project_defaults: {}
      };
      
      const result = validateBasicStructure(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Field \'technical.preferred_languages\' must be an array');
    });
  });
});