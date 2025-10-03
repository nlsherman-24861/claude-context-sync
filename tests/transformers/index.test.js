import { describe, it, expect } from 'vitest';
import { 
  createTransformer, 
  getAvailableFormats, 
  isFormatSupported,
  ChatFormatTransformer,
  ClaudeMdFormatTransformer
} from '../../src/transformers/index.js';

describe('Transformer Registry', () => {
  describe('createTransformer', () => {
    it('should create ChatFormatTransformer for chat format', () => {
      const preferences = { working_style: { communication: ['test'] } };
      const transformer = createTransformer('chat', preferences);

      expect(transformer).toBeInstanceOf(ChatFormatTransformer);
      expect(transformer.preferences).toBe(preferences);
    });

    it('should create ClaudeMdFormatTransformer for claude-md format', () => {
      const preferences = { working_style: { communication: ['test'] } };
      const transformer = createTransformer('claude-md', preferences);

      expect(transformer).toBeInstanceOf(ClaudeMdFormatTransformer);
      expect(transformer.preferences).toBe(preferences);
    });

    it('should throw error for unknown format', () => {
      const preferences = {};
      
      expect(() => createTransformer('unknown', preferences)).toThrow(
        'Unknown transformer format: unknown. Available formats: chat, claude-md'
      );
    });
  });

  describe('getAvailableFormats', () => {
    it('should return array of available formats', () => {
      const formats = getAvailableFormats();

      expect(formats).toBeInstanceOf(Array);
      expect(formats).toContain('chat');
      expect(formats).toContain('claude-md');
      expect(formats).toContain('hybrid');
      expect(formats).toHaveLength(3);
    });
  });

  describe('isFormatSupported', () => {
    it('should return true for supported formats', () => {
      expect(isFormatSupported('chat')).toBe(true);
      expect(isFormatSupported('claude-md')).toBe(true);
    });

    it('should return false for unsupported formats', () => {
      expect(isFormatSupported('unknown')).toBe(false);
      expect(isFormatSupported('json')).toBe(false);
      expect(isFormatSupported('')).toBe(false);
    });
  });

  describe('exports', () => {
    it('should export transformer classes', () => {
      expect(ChatFormatTransformer).toBeDefined();
      expect(ClaudeMdFormatTransformer).toBeDefined();
    });
  });
});