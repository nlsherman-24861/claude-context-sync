import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadConfig } from '../src/config/index.js';
import { createTransformer } from '../src/transformers/index.js';

describe('Generated Markdown Validation', () => {
  it('should generate valid markdown for CLAUDE.md format', async () => {
    // Load config and generate markdown
    const { config } = await loadConfig();
    const transformer = createTransformer('claude-md', config);
    const output = await transformer.transform();

    // Write to temp file
    const tempDir = join(tmpdir(), 'markdown-lint-test');
    mkdirSync(tempDir, { recursive: true });
    const tempFile = join(tempDir, 'test-output.md');
    writeFileSync(tempFile, output);

    // Run markdownlint on the generated file
    try {
      execSync(`npx markdownlint -c .markdownlint-generated.json "${tempFile}"`, {
        encoding: 'utf-8',
        cwd: process.cwd()
      });
      // If we get here, linting passed
      expect(true).toBe(true);
    } catch (error) {
      // Lint failed - show the errors
      console.error('Markdown lint errors in generated CLAUDE.md:');
      console.error(error.stdout || error.message);
      throw new Error(`Generated markdown has linting errors:\n${error.stdout}`);
    }
  });

  it('should generate valid markdown for chat format', async () => {
    // Load config and generate markdown (chat format is prose, less strict)
    const { config } = await loadConfig();
    const transformer = createTransformer('chat', config);
    const output = await transformer.transform();

    // Basic validation - should not be empty and should have content
    expect(output).toBeTruthy();
    expect(output.length).toBeGreaterThan(100);
    
    // Check it's valid prose (no markdown lint needed for chat format)
    expect(output).not.toContain('undefined');
    expect(output).not.toContain('[object Object]');
  });
});
