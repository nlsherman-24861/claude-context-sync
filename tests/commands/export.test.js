import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportCmd, showAvailableFormats } from '../../src/commands/export.js';
import * as config from '../../src/config/index.js';
import * as fs from '../../src/utils/fs.js';
import * as logger from '../../src/utils/logger.js';

// Mock dependencies
vi.mock('../../src/config/index.js');
vi.mock('../../src/utils/fs.js');
vi.mock('../../src/utils/logger.js');

describe('Export Command', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock console.log to capture output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Mock process.exit
    vi.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportCmd', () => {
    const mockConfig = {
      professional_background: {
        experience: '15 years software engineering'
      },
      working_style: {
        communication: ['High-level summaries']
      },
      technical_approach: {
        philosophy: ['Clean code']
      }
    };

    beforeEach(() => {
      config.loadConfig.mockResolvedValue({ config: mockConfig });
    });

    describe('format validation', () => {
      it('should throw error if format is missing', async () => {
        const options = {};

        await exportCmd(options);

        expect(logger.error).toHaveBeenCalledWith('Export failed: Format is required. Use --format <format>');
        expect(process.exit).toHaveBeenCalledWith(1);
      });

      it('should throw error for unknown format', async () => {
        const options = { format: 'unknown' };

        await exportCmd(options);

        expect(logger.error).toHaveBeenCalledWith(
          'Export failed: Unknown format: unknown. Available formats: chat, claude-md'
        );
        expect(process.exit).toHaveBeenCalledWith(1);
      });
    });

    describe('successful export', () => {
      it('should export to stdout by default', async () => {
        const options = { format: 'chat' };

        await exportCmd(options);

        expect(config.loadConfig).toHaveBeenCalledWith(undefined);
        expect(console.log).toHaveBeenCalled();
        
        // Get the output that was logged
        const output = console.log.mock.calls[0][0];
        expect(output).toContain('15 years software engineering');
      });

      it('should export to file when output specified', async () => {
        const options = { 
          format: 'claude-md',
          output: '/tmp/test.md'
        };

        await exportCmd(options);

        expect(fs.writeText).toHaveBeenCalledWith('/tmp/test.md', expect.stringContaining('# Claude Code Preferences'));
        expect(logger.success).toHaveBeenCalledWith('Exported to /tmp/test.md');
      });

      it('should use custom config path', async () => {
        const options = { 
          format: 'chat',
          configPath: '/custom/path.yaml'
        };

        await exportCmd(options);

        expect(config.loadConfig).toHaveBeenCalledWith('/custom/path.yaml');
      });
    });

    describe('section filtering', () => {
      it('should export specific section only', async () => {
        const options = { 
          format: 'chat',
          section: 'working_style'
        };

        await exportCmd(options);

        const output = console.log.mock.calls[0][0];
        expect(output).toContain('high-level summaries'); // Formatter lowercases first letter
        expect(output).not.toContain('15 years software engineering'); // From professional_background
      });

      it('should throw error for non-existent section', async () => {
        const options = { 
          format: 'chat',
          section: 'non_existent'
        };

        await exportCmd(options);

        expect(logger.error).toHaveBeenCalledWith(
          "Export failed: Section 'non_existent' not found in preferences"
        );
        expect(process.exit).toHaveBeenCalledWith(1);
      });
    });

    describe('validation integration', () => {
      it('should fail on validation errors', async () => {
        // Mock config with no chat-scoped content
        config.loadConfig.mockResolvedValue({ 
          config: { 
            technical_approach: { philosophy: ['Clean code'] } // Only global/project scope
          } 
        });

        const options = { format: 'chat' };

        await exportCmd(options);

        expect(logger.error).toHaveBeenCalledWith(
          'Validation failed: No sections found for chat scope'
        );
        expect(process.exit).toHaveBeenCalledWith(1);
      });
    });

    describe('error handling', () => {
      it('should handle config loading errors', async () => {
        config.loadConfig.mockRejectedValue(new Error('Config not found'));

        const options = { format: 'chat' };

        await exportCmd(options);

        expect(logger.error).toHaveBeenCalledWith('Export failed: Config not found');
        expect(process.exit).toHaveBeenCalledWith(1);
      });

      it('should handle file writing errors', async () => {
        fs.writeText.mockRejectedValue(new Error('Permission denied'));

        const options = { 
          format: 'chat',
          output: '/restricted/file.txt'
        };

        await exportCmd(options);

        expect(logger.error).toHaveBeenCalledWith('Export failed: Permission denied');
        expect(process.exit).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('showAvailableFormats', () => {
    it('should display available formats', () => {
      showAvailableFormats();

      expect(logger.info).toHaveBeenCalledWith('Available export formats:');
      expect(console.log).toHaveBeenCalledWith('  chat');
      expect(console.log).toHaveBeenCalledWith('  claude-md');
    });
  });
});