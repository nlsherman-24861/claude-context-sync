import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  setVerbose,
  debug,
  info,
  success,
  warn,
  error,
  formatError,
  printError
} from '../src/utils/logger.js';

describe('Logger', () => {
  let consoleSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Reset verbose mode
    setVerbose(false);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('verbose mode', () => {
    it('should not show debug messages when verbose is false', () => {
      setVerbose(false);
      debug('test debug message');
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should show debug messages when verbose is true', () => {
      setVerbose(true);
      debug('test debug message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔍'),
        expect.stringContaining('test debug message')
      );
    });
  });

  describe('log levels', () => {
    it('should output info messages with blue arrow', () => {
      info('test info');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('→'),
        'test info'
      );
    });

    it('should output success messages with green checkmark', () => {
      success('test success');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✓'),
        'test success'
      );
    });

    it('should output warning messages with yellow warning', () => {
      warn('test warning');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠'),
        expect.stringContaining('test warning')
      );
    });

    it('should output error messages with red X', () => {
      error('test error');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('✗'),
        expect.stringContaining('test error')
      );
    });
  });

  describe('formatError', () => {
    it('should format Error objects', () => {
      const err = new Error('Test error message');
      err.name = 'TestError';
      
      const formatted = formatError(err);
      
      expect(formatted.title).toBe('TestError');
      expect(formatted.message).toBe('Test error message');
      expect(formatted.stack).toBeNull(); // verbose is false
    });

    it('should include stack trace in verbose mode', () => {
      setVerbose(true);
      const err = new Error('Test error');
      
      const formatted = formatError(err);
      
      expect(formatted.stack).toBeTruthy();
    });

    it('should handle non-Error objects', () => {
      const formatted = formatError('string error');
      
      expect(formatted.title).toBe('Unknown Error');
      expect(formatted.message).toBe('string error');
    });
  });

  describe('printError', () => {
    it('should print formatted error', () => {
      const err = new Error('Test error');
      
      printError(err);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('✗'),
        expect.stringContaining('Error: Test error')
      );
    });

    it('should suggest verbose mode when not verbose', () => {
      setVerbose(false);
      const err = new Error('Test error');
      
      printError(err);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Run with --verbose for more details')
      );
    });

    it('should show stack trace in verbose mode', () => {
      setVerbose(true);
      const err = new Error('Test error');
      
      printError(err);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Error: Test error/)
      );
      // Stack trace should be printed as separate call
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('at ')
      );
    });
  });
});