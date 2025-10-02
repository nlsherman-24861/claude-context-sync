import { describe, it, expect } from 'vitest';
import { BaseTransformer } from '../../src/transformers/base.js';

describe('BaseTransformer', () => {
  describe('scope filtering', () => {
    const preferences = {
      professional_background: {
        experience: '15 years',
        technical_level: 'Senior'
      },
      working_style: {
        communication: ['High-level summaries']
      },
      technical_approach: {
        philosophy: ['Clean code']
      },
      section_with_explicit_scope: {
        _scope: ['chat'],
        content: 'Chat only content'
      },
      section_with_multi_scope: {
        _scope: ['chat', 'global'],
        content: 'Multi-scope content'
      }
    };

    it('should filter by single scope', () => {
      const transformer = new BaseTransformer(preferences);
      const chatSections = transformer.filterByScope('chat');

      expect(chatSections).toHaveProperty('professional_background');
      expect(chatSections).toHaveProperty('working_style');
      expect(chatSections).toHaveProperty('section_with_explicit_scope');
      expect(chatSections).toHaveProperty('section_with_multi_scope');
      expect(chatSections).not.toHaveProperty('technical_approach');
    });

    it('should filter by multiple scopes', () => {
      const transformer = new BaseTransformer(preferences);
      const sections = transformer.filterByScope(['global', 'project']);

      expect(sections).toHaveProperty('working_style');
      expect(sections).toHaveProperty('technical_approach');
      expect(sections).toHaveProperty('section_with_multi_scope');
      expect(sections).not.toHaveProperty('section_with_explicit_scope'); // chat only
    });

    it('should respect explicit _scope field', () => {
      const transformer = new BaseTransformer(preferences);
      const chatSections = transformer.filterByScope('chat');

      expect(chatSections.section_with_explicit_scope).toEqual({
        _scope: ['chat'],
        content: 'Chat only content'
      });
    });

    it('should handle empty preferences', () => {
      const transformer = new BaseTransformer({});
      const sections = transformer.filterByScope('chat');

      expect(sections).toEqual({});
    });

    it('should filter out non-object values', () => {
      const invalidPrefs = {
        string_value: 'just a string',
        number_value: 42,
        valid_section: {
          content: 'valid'
        }
      };

      const transformer = new BaseTransformer(invalidPrefs);
      const sections = transformer.filterByScope('global');

      expect(sections).not.toHaveProperty('string_value');
      expect(sections).not.toHaveProperty('number_value');
      expect(sections).toHaveProperty('valid_section');
    });
  });

  describe('default scope mapping', () => {
    it('should use correct default scopes for known sections', () => {
      const transformer = new BaseTransformer({});
      
      expect(transformer._getDefaultScopes('professional_background')).toEqual(['chat', 'global']);
      expect(transformer._getDefaultScopes('working_style')).toEqual(['chat', 'global', 'project']);
      expect(transformer._getDefaultScopes('technical_approach')).toEqual(['global', 'project']);
      expect(transformer._getDefaultScopes('unknown_section')).toEqual(['global']);
    });
  });

  describe('abstract methods', () => {
    it('should require transform implementation', async () => {
      const transformer = new BaseTransformer({});
      
      await expect(transformer.transform()).rejects.toThrow('transform() must be implemented by subclasses');
    });

    it('should provide default validation', () => {
      const transformer = new BaseTransformer({});
      const result = transformer.validate();

      expect(result).toEqual({ valid: true, errors: [] });
    });
  });
});