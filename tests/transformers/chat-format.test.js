import { describe, it, expect } from 'vitest';
import { ChatFormatTransformer } from '../../src/transformers/chat-format.js';

describe('ChatFormatTransformer', () => {
  describe('professional background formatting', () => {
    it('should format complete professional background', async () => {
      const preferences = {
        professional_background: {
          experience: '15-20 years practical software engineering',
          technical_level: 'Strong technical background',
          philosophy: [
            'Love learning and the process of problem solving',
            'Prefer understanding what and why to quick-and-easy fixes'
          ]
        }
      };

      const transformer = new ChatFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('15-20 years practical software engineering');
      expect(output).toContain('strong technical background');
      expect(output).toContain('Love learning and the process of problem solving');
      expect(output).toContain('Prefer understanding what and why to quick-and-easy fixes');
    });

    it('should handle minimal professional background', async () => {
      const preferences = {
        professional_background: {
          experience: '10 years'
        }
      };

      const transformer = new ChatFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('10 years');
      expect(output).not.toContain('undefined');
    });
  });

  describe('personal interests formatting', () => {
    it('should format personal interests naturally', async () => {
      const preferences = {
        personal_interests: {
          primary: ['Sci-fi', 'Psychology'],
          engagement_style: ['Enjoy good debates without heat'],
          generation: 'Late Gen-X / Early Millennial'
        }
      };

      const transformer = new ChatFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('Sci-fi and Psychology');
      expect(output).toContain('Enjoy good debates without heat');
      expect(output).toContain('Late Gen-X / Early Millennial');
    });
  });

  describe('working style formatting', () => {
    it('should format working style in natural prose', async () => {
      const preferences = {
        working_style: {
          communication: [
            'High-level summaries with structured outlines',
            'Concise bullets for action items'
          ],
          feedback: [
            'Positive reinforcement but not pandering',
            'Never pushy'
          ]
        }
      };

      const transformer = new ChatFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('I prefer high-level summaries');
      expect(output).toContain('concise bullets for action items');
      expect(output).toContain('I appreciate positive reinforcement');
    });
  });

  describe('personality formatting', () => {
    it('should format personality with JAX construct', async () => {
      const preferences = {
        personality: {
          construct_name: 'JAX',
          description: 'Pseudo-anthropomorphic entity with intimate knowledge',
          traits: [
            'Friendly personality with dry sense of humor',
            'Motivating but never pushy'
          ]
        }
      };

      const transformer = new ChatFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('Think of yourself as "JAX"');
      expect(output).toContain('Pseudo-anthropomorphic entity');
      expect(output).toContain('friendly personality with dry sense of humor');
      expect(output).toContain('motivating but never pushy');
    });
  });

  describe('list formatting', () => {
    it('should format single item lists', async () => {
      const preferences = {
        personal_interests: {
          primary: ['Sci-fi']
        }
      };

      const transformer = new ChatFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('My interests include Sci-fi');
    });

    it('should format two item lists with "and"', async () => {
      const preferences = {
        personal_interests: {
          primary: ['Sci-fi', 'Psychology']
        }
      };

      const transformer = new ChatFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('Sci-fi and Psychology');
    });

    it('should format multiple item lists with commas and "and"', async () => {
      const preferences = {
        personal_interests: {
          primary: ['Sci-fi', 'Psychology', 'Technical debates']
        }
      };

      const transformer = new ChatFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('Sci-fi, Psychology, and Technical debates');
    });
  });

  describe('legacy field support', () => {
    it('should handle legacy personal fields', async () => {
      const preferences = {
        personal: {
          name: 'John Doe',
          background: '15 years software engineering',
          interests: ['coding', 'music']
        }
      };

      const transformer = new ChatFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('John Doe');
      expect(output).toContain('15 years software engineering');
      expect(output).toContain('coding and music');
    });
  });

  describe('output quality', () => {
    it('should produce natural conversational prose', async () => {
      const preferences = {
        professional_background: {
          experience: '15 years software engineering'
        },
        working_style: {
          communication: ['High-level summaries', 'Concise action items']
        }
      };

      const transformer = new ChatFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).not.toContain('```'); // No code blocks
      expect(output).not.toContain('- ['); // No markdown checkboxes
      expect(output).not.toContain('##'); // No headers
      expect(output).toMatch(/\. /); // Contains proper sentences
    });

    it('should handle empty sections gracefully', async () => {
      const transformer = new ChatFormatTransformer({});
      const output = await transformer.transform();

      expect(output).toBe('');
    });
  });

  describe('validation', () => {
    it('should validate successfully with content', () => {
      const preferences = {
        working_style: {
          communication: ['Some communication style']
        }
      };

      const transformer = new ChatFormatTransformer(preferences);
      const validation = transformer.validate();

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should fail validation with no chat-scoped content', () => {
      const preferences = {
        technical_approach: { // Only global/project scope
          philosophy: ['Some philosophy']
        }
      };

      const transformer = new ChatFormatTransformer(preferences);
      const validation = transformer.validate();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('No sections found for chat scope');
    });
  });
});