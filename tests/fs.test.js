import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  ensureDir,
  fileExists,
  readYaml,
  writeYaml,
  readText,
  writeText
} from '../src/utils/fs.js';

const tempDir = join(tmpdir(), 'claude-context-sync-fs-test');

beforeEach(async () => {
  await fs.mkdir(tempDir, { recursive: true });
});

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('File System Utilities', () => {
  describe('ensureDir', () => {
    it('should create directory if it does not exist', async () => {
      const dirPath = join(tempDir, 'new-dir');
      
      await ensureDir(dirPath);
      
      const stats = await fs.stat(dirPath);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should not fail if directory already exists', async () => {
      const dirPath = join(tempDir, 'existing-dir');
      await fs.mkdir(dirPath);
      
      await expect(ensureDir(dirPath)).resolves.toBe(true);
    });

    it('should create nested directories', async () => {
      const nestedPath = join(tempDir, 'level1', 'level2', 'level3');
      
      await ensureDir(nestedPath);
      
      const stats = await fs.stat(nestedPath);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const filePath = join(tempDir, 'existing.txt');
      await fs.writeFile(filePath, 'content');
      
      const exists = await fileExists(filePath);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      const filePath = join(tempDir, 'nonexistent.txt');
      
      const exists = await fileExists(filePath);
      expect(exists).toBe(false);
    });
  });

  describe('readYaml and writeYaml', () => {
    it('should write and read YAML data', async () => {
      const yamlPath = join(tempDir, 'test.yaml');
      const data = {
        name: 'Test',
        items: ['one', 'two'],
        nested: { key: 'value' }
      };
      
      await writeYaml(yamlPath, data);
      const readData = await readYaml(yamlPath);
      
      expect(readData).toEqual(data);
    });

    it('should create parent directories when writing', async () => {
      const yamlPath = join(tempDir, 'nested', 'dir', 'test.yaml');
      const data = { test: 'value' };
      
      await writeYaml(yamlPath, data);
      const readData = await readYaml(yamlPath);
      
      expect(readData).toEqual(data);
    });

    it('should throw error when reading non-existent file', async () => {
      const yamlPath = join(tempDir, 'nonexistent.yaml');
      
      await expect(readYaml(yamlPath))
        .rejects
        .toThrow('File not found');
    });
  });

  describe('readText and writeText', () => {
    it('should write and read text content', async () => {
      const textPath = join(tempDir, 'test.txt');
      const content = 'This is test content\\nWith multiple lines';
      
      await writeText(textPath, content);
      const readContent = await readText(textPath);
      
      expect(readContent).toBe(content);
    });

    it('should create parent directories when writing text', async () => {
      const textPath = join(tempDir, 'nested', 'dir', 'test.txt');
      const content = 'test content';
      
      await writeText(textPath, content);
      const readContent = await readText(textPath);
      
      expect(readContent).toBe(content);
    });

    it('should throw error when reading non-existent text file', async () => {
      const textPath = join(tempDir, 'nonexistent.txt');
      
      await expect(readText(textPath))
        .rejects
        .toThrow('File not found');
    });
  });
});