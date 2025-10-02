import { describe, it, expect } from 'vitest';
import { loadConfig } from '../../src/config/index.js';
import { createTransformer } from '../../src/transformers/index.js';

describe('Export Integration Tests', () => {
  const fullPreferences = {
    professional_background: {
      experience: '15-20 years practical software engineering',
      technical_level: 'Strong technical background',
      philosophy: [
        'Love learning and the process of problem solving',
        'Prefer understanding what and why to quick-and-easy fixes'
      ]
    },
    personal_interests: {
      primary: ['Sci-fi', 'Psychology'],
      engagement_style: ['Enjoy good debates without heat'],
      generation: 'Late Gen-X / Early Millennial'
    },
    working_style: {
      communication: [
        'High-level summaries with structured outlines',
        'Concise bullets for action items'
      ],
      feedback: [
        'Positive reinforcement but not pandering',
        'Never pushy'
      ]
    },
    technical_approach: {
      philosophy: [
        'Pragmatic AI optimist',
        'Fully aware of objective weaknesses'
      ],
      coding_style: [
        'Value understanding root causes over surface fixes'
      ]
    },
    personality: {
      construct_name: 'JAX',
      description: 'Pseudo-anthropomorphic entity with intimate knowledge',
      traits: [
        'Friendly personality with dry sense of humor',
        'Motivating but never pushy'
      ]
    }
  };

  describe('Full workflow: load config → transform → validate output', () => {
    it('should successfully transform full config to chat format', async () => {
      const transformer = createTransformer('chat', fullPreferences);
      
      // Validate before transform
      const validation = transformer.validate();
      expect(validation.valid).toBe(true);
      
      // Transform
      const output = await transformer.transform();

      // Verify output quality
      expect(output).toContain('15-20 years practical software engineering');
      expect(output).toContain('Sci-fi and Psychology');
      expect(output).toContain('I prefer high-level summaries');
      expect(output).toContain('Think of yourself as "JAX"');
      
      // Verify natural prose format
      expect(output).not.toContain('##'); // No markdown headers
      expect(output).not.toMatch(/^\s*- /m); // No bullet points at line start
      expect(output).toMatch(/\. /); // Contains proper sentences
    });

    it('should successfully transform full config to claude-md format', async () => {
      const transformer = createTransformer('claude-md', fullPreferences);
      
      // Validate before transform
      const validation = transformer.validate();
      expect(validation.valid).toBe(true);
      
      // Transform
      const output = await transformer.transform();
      
      // Verify structured markdown
      expect(output).toContain('# Claude Code Preferences');
      expect(output).toContain('## Professional Background');
      expect(output).toContain('## Personal Interests');
      expect(output).toContain('## Working Style');
      expect(output).toContain('## Technical Approach');
      expect(output).toContain('## Personality (Optional)');
      
      // Verify content
      expect(output).toContain('- **Experience**: 15-20 years practical software engineering');
      expect(output).toContain('- High-level summaries with structured outlines');
      expect(output).toContain('**Assistant Persona**: JAX');
    });
  });

  describe('Minimal config handling', () => {
    const minimalPreferences = {
      working_style: {
        communication: ['Basic communication preference']
      }
    };

    it('should handle minimal config for chat format', async () => {
      const transformer = createTransformer('chat', minimalPreferences);
      
      const validation = transformer.validate();
      expect(validation.valid).toBe(true);
      
      const output = await transformer.transform();
      expect(output).toContain('I prefer basic communication preference');
    });

    it('should handle minimal config for claude-md format', async () => {
      const transformer = createTransformer('claude-md', minimalPreferences);
      
      const validation = transformer.validate();
      expect(validation.valid).toBe(true);
      
      const output = await transformer.transform();
      expect(output).toContain('# Claude Code Preferences');
      expect(output).toContain('## Working Style');
      expect(output).toContain('- Basic communication preference');
    });
  });

  describe('Scope filtering accuracy', () => {
    const scopedPreferences = {
      chat_only: {
        _scope: ['chat'],
        content: 'Chat only content'
      },
      global_only: {
        _scope: ['global'],
        content: 'Global only content'
      },
      project_only: {
        _scope: ['project'],
        content: 'Project only content'
      },
      chat_and_global: {
        _scope: ['chat', 'global'],
        content: 'Chat and global content'
      },
      working_style: { // Default: chat, global, project
        communication: ['All scopes communication']
      },
      technical_approach: { // Default: global, project
        philosophy: ['Global and project philosophy']
      }
    };

    it('should include only chat-scoped content in chat format', async () => {
      const transformer = createTransformer('chat', scopedPreferences);
      const output = await transformer.transform();

      expect(output).toContain('Chat only content');
      expect(output).toContain('Chat and global content');
      expect(output).toContain('all scopes communication'); // working_style includes chat (lowercase from formatter)
      
      expect(output).not.toContain('Global only content');
      expect(output).not.toContain('Project only content');
      expect(output).not.toContain('Global and project philosophy'); // technical_approach excludes chat
    });

    it('should include chat and global scoped content in claude-md format', async () => {
      const transformer = createTransformer('claude-md', scopedPreferences);
      const output = await transformer.transform();

      expect(output).toContain('Chat only content');
      expect(output).toContain('Global only content');
      expect(output).toContain('Chat and global content');
      expect(output).toContain('All scopes communication');
      expect(output).toContain('Global and project philosophy');
      
      expect(output).not.toContain('Project only content'); // Only project scope
    });
  });

  describe('Legacy field compatibility', () => {
    const legacyPreferences = {
      personal: {
        name: 'John Doe',
        background: '15 years experience',
        interests: ['coding', 'music']
      },
      technical: {
        philosophy: ['Clean code', 'TDD'],
        style: 'Functional programming'
      }
    };

    it('should handle legacy fields in chat format', async () => {
      const transformer = createTransformer('chat', legacyPreferences);
      const output = await transformer.transform();

      expect(output).toContain('John Doe');
      expect(output).toContain('15 years experience');
      expect(output).toContain('coding and music');
    });

    it('should handle legacy fields in claude-md format', async () => {
      const transformer = createTransformer('claude-md', legacyPreferences);
      const output = await transformer.transform();

      expect(output).toContain('## Background');
      expect(output).toContain('- **Name**: John Doe');
      expect(output).toContain('## Technical Preferences');
      expect(output).toContain('- Clean code');
      expect(output).toContain('- **Style**: Functional programming');
    });
  });

  describe('Error conditions', () => {
    it('should fail validation with no applicable content for chat', () => {
      const noContentPreferences = {
        technical_approach: { // Only global/project scope
          philosophy: ['Some philosophy']
        }
      };

      const transformer = createTransformer('chat', noContentPreferences);
      const validation = transformer.validate();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('No sections found for chat scope');
    });

    it('should fail validation with no applicable content for claude-md', () => {
      const noContentPreferences = {
        project_only: {
          _scope: ['project'],
          content: 'Project only'
        }
      };

      const transformer = createTransformer('claude-md', noContentPreferences);
      const validation = transformer.validate();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('No sections found for global scope');
    });
  });
});