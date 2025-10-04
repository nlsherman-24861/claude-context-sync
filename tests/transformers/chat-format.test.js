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
      expect(output).toContain('Strong technical background');
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

      expect(output).toContain('The user prefers high-level summaries');
      expect(output).toContain('concise bullets for action items');
      expect(output).toContain('the user appreciates positive reinforcement');
    });
  });

  describe('personality formatting', () => {
    it('should format personality with construct_name and archetype', async () => {
      const preferences = {
        personality: {
          construct_name: 'JAX',
          archetype: 'Competent engineering buddy who happens to live in the terminal',
          description: 'Pseudo-anthropomorphic entity with intimate knowledge',
          traits: [
            'Friendly personality with dry sense of humor',
            'Motivating but never pushy'
          ]
        }
      };

      const transformer = new ChatFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('Your name is "JAX"');
      expect(output).toContain('Competent engineering buddy');
      expect(output).toContain('Your personality traits:');
      expect(output).toContain('friendly personality with dry sense of humor');
      expect(output).toContain('motivating but never pushy');
    });

    it('should use description when archetype is missing', async () => {
      const preferences = {
        personality: {
          construct_name: 'JAX',
          description: 'Pseudo-anthropomorphic conversational AI entity',
          traits: [
            'Dry sense of humor'
          ]
        }
      };

      const transformer = new ChatFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('Your name is "JAX"');
      expect(output).toContain('Pseudo-anthropomorphic conversational AI entity');
      expect(output).toContain('dry sense of humor');
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

      expect(output).toContain("The user's interests include Sci-fi");
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

      // Should have metadata comment even for empty preferences
      expect(output).toContain('<!-- Generated by claude-context-sync');
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

  describe('creative pursuits - generic handling', () => {
    it('should format writing creative pursuits with pen_name', async () => {
      const preferences = {
        creative_pursuits: {
          writing: {
            pen_name: 'J.K. Rowling',
            passion: 'Storytelling through fantasy',
            background: [
              'Published author',
              'Working on novel series'
            ],
            active_work: {
              role: 'Fantasy novelist',
              genres: ['Fantasy', 'Young Adult'],
              approach: ['Character-driven narratives', 'World-building focus']
            }
          }
        }
      };

      const transformer = new ChatFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('writing');
      expect(output).toContain('J.K. Rowling');
      expect(output).toContain('Storytelling through fantasy');
      expect(output).toContain('Fantasy novelist');
      expect(output).toContain('Fantasy');
      expect(output).toContain('Young Adult');
      // CRITICAL: Should NOT contain music-specific language
      expect(output).not.toContain('music');
      expect(output).not.toContain('artist');
    });

    it('should format visual arts creative pursuits with alias', async () => {
      const preferences = {
        creative_pursuits: {
          visual_arts: {
            alias: 'Shutterbug Studios',
            passion: 'Capturing urban landscapes',
            active_work: {
              role: 'Urban photographer',
              genres: ['Street photography', 'Architectural']
            },
            engagement_patterns: [
              'Composition discussions',
              'Technical photography advice'
            ]
          }
        }
      };

      const transformer = new ChatFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('visual_arts');
      expect(output).toContain('Shutterbug Studios');
      expect(output).toContain('Urban photographer');
      expect(output).toContain('Street photography');
      // CRITICAL: Should NOT contain music or writing language
      expect(output).not.toContain('music');
      expect(output).not.toContain('writing');
      expect(output).not.toContain('pen_name');
    });

    it('should handle multiple creative pursuits simultaneously', async () => {
      const preferences = {
        creative_pursuits: {
          music: {
            artist_alias: 'DJ Awesome',
            active_work: {
              role: 'Electronic music producer',
              genres: ['Techno', 'House']
            }
          },
          writing: {
            pen_name: 'A. Writer',
            active_work: {
              role: 'Blogger',
              genres: ['Tech writing']
            }
          }
        }
      };

      const transformer = new ChatFormatTransformer(preferences);
      const output = await transformer.transform();

      // Should include BOTH pursuits
      expect(output).toContain('DJ Awesome');
      expect(output).toContain('A. Writer');
      expect(output).toContain('music');
      expect(output).toContain('writing');
      expect(output).toContain('Techno');
      expect(output).toContain('Blogger');
    });

    it('should handle music creative pursuits (original use case)', async () => {
      const preferences = {
        creative_pursuits: {
          music: {
            artist_alias: 'Left Out West',
            passion: 'Love of music across all genres',
            active_work: {
              role: 'Producer, lyricist',
              genres: ['Hip hop', 'Electronica']
            }
          }
        }
      };

      const transformer = new ChatFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('music');
      expect(output).toContain('Left Out West');
      expect(output).toContain('Producer, lyricist');
      expect(output).toContain('Hip hop');
    });
  });

  describe('professional background - no hardcoded profession', () => {
    it('should handle teacher background without assuming engineer', async () => {
      const preferences = {
        professional_background: {
          experience: '10 years teaching high school mathematics',
          technical_level: 'Strong pedagogical background'
        }
      };

      const transformer = new ChatFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('10 years teaching high school mathematics');
      expect(output).toContain('Strong pedagogical background');
      // CRITICAL: Should NOT inject 'software engineer' or 'engineering'
      expect(output).not.toContain('software engineer');
      expect(output).not.toContain('engineering');
    });

    it('should handle scientist background', async () => {
      const preferences = {
        professional_background: {
          experience: '15 years in biomedical research',
          technical_level: 'PhD in molecular biology'
        }
      };

      const transformer = new ChatFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('15 years in biomedical research');
      expect(output).toContain('PhD in molecular biology');
      // Should not have any hardcoded profession
      expect(output).not.toContain('software');
      expect(output).not.toContain('engineer');
    });
  });
});