import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'yaml';
import { validateBasicStructure } from '../src/parsers/yaml-parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

describe('Preferences Validation', () => {
  describe('Default preferences', () => {
    it('should validate default-preferences.yaml', () => {
      const content = readFileSync(
        join(projectRoot, 'default-preferences.yaml'),
        'utf-8'
      );
      const config = parse(content);
      const validation = validateBasicStructure(config);

      expect(validation.valid).toBe(true);
      if (!validation.valid) {
        console.error('Validation errors:', validation.errors);
      }
    });
  });

  describe('Required structure', () => {
    it('should require personal.name field', () => {
      const config = {
        personal: { role: 'Developer' },
        technical: {},
        project_defaults: {}
      };
      
      const validation = validateBasicStructure(config);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing required field: personal.name');
    });

    it('should require personal.role field', () => {
      const config = {
        personal: { name: 'Test' },
        technical: {},
        project_defaults: {}
      };
      
      const validation = validateBasicStructure(config);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing required field: personal.role');
    });

    it('should require personal section', () => {
      const config = {
        technical: {},
        project_defaults: {}
      };
      
      const validation = validateBasicStructure(config);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing required section: personal');
    });

    it('should require technical section', () => {
      const config = {
        personal: { name: 'Test', role: 'Dev' },
        project_defaults: {}
      };
      
      const validation = validateBasicStructure(config);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing required section: technical');
    });

    it('should require project_defaults section', () => {
      const config = {
        personal: { name: 'Test', role: 'Dev' },
        technical: {}
      };
      
      const validation = validateBasicStructure(config);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing required section: project_defaults');
    });

    it('should accept valid minimal config', () => {
      const config = {
        personal: { name: 'Test', role: 'Developer' },
        technical: {},
        project_defaults: {}
      };
      
      const validation = validateBasicStructure(config);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });
  });

  describe('Technical section arrays', () => {
    it('should reject non-array preferred_languages', () => {
      const config = {
        personal: { name: 'Test', role: 'Dev' },
        technical: { preferred_languages: 'JavaScript' },
        project_defaults: {}
      };
      
      const validation = validateBasicStructure(config);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain("Field 'technical.preferred_languages' must be an array");
    });

    it('should accept array technical fields', () => {
      const config = {
        personal: { name: 'Test', role: 'Dev' },
        technical: {
          preferred_languages: ['JavaScript'],
          frameworks: ['React'],
          tools: ['Git'],
          platforms: ['Linux']
        },
        project_defaults: {}
      };
      
      const validation = validateBasicStructure(config);
      expect(validation.valid).toBe(true);
    });
  });

  describe('YAML syntax', () => {
    it('should parse valid YAML without errors', () => {
      const validYaml = `
personal:
  name: "Test User"
  role: "Developer"
technical: {}
project_defaults: {}
`;
      
      expect(() => parse(validYaml)).not.toThrow();
      const config = parse(validYaml);
      const validation = validateBasicStructure(config);
      expect(validation.valid).toBe(true);
    });

    it('should handle multiline strings with >-', () => {
      const yamlWithMultiline = `
personal:
  name: "Test"
  role: "Dev"
technical: {}
project_defaults:
  description: >-
    This is a long description
    that spans multiple lines
`;
      
      expect(() => parse(yamlWithMultiline)).not.toThrow();
      const config = parse(yamlWithMultiline);
      expect(config.project_defaults.description).toContain('long description');
    });
  });
});
