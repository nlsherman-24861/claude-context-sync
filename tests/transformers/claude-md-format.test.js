import { describe, it, expect } from 'vitest';
import { ClaudeMdFormatTransformer } from '../../src/transformers/claude-md-format.js';

describe('ClaudeMdFormatTransformer', () => {
  describe('professional background formatting', () => {
    it('should format professional background with headers and bullets', async () => {
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

      const transformer = new ClaudeMdFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('## Professional Background');
      expect(output).toContain('- **Experience**: 15-20 years practical software engineering');
      expect(output).toContain('- **Technical Level**: Strong technical background');
      expect(output).toContain('### Philosophy');
      expect(output).toContain('- Love learning and the process of problem solving');
    });
  });

  describe('working style formatting', () => {
    it('should format working style with structured sections', async () => {
      const preferences = {
        working_style: {
          communication: [
            'High-level summaries with structured outlines',
            'Concise bullets for action items'
          ],
          context_management: [
            'Generate file content in VM behind the scenes',
            'Provide concise summaries of generated content'
          ],
          feedback: [
            'Positive reinforcement but not pandering'
          ]
        }
      };

      const transformer = new ClaudeMdFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('## Working Style');
      expect(output).toContain('### Communication Preferences');
      expect(output).toContain('### Context Management');
      expect(output).toContain('### Feedback Style');
      expect(output).toContain('- High-level summaries with structured outlines');
      expect(output).toContain('- Generate file content in VM behind the scenes');
      expect(output).toContain('- Positive reinforcement but not pandering');
    });
  });

  describe('technical approach formatting', () => {
    it('should format technical approach with workflow subsections', async () => {
      const preferences = {
        technical_approach: {
          philosophy: [
            'Pragmatic AI optimist looking for realistic solutions',
            'Fully aware of objective weaknesses and limitations'
          ],
          coding_style: [
            'Value understanding root causes over surface fixes',
            'Balance technical rigor with maintainability'
          ],
          workflow: {
            git_and_github: [
              'Prefer bash commands over abstractions',
              'Clone repos locally to work efficiently'
            ],
            credentials: [
              'Use github-credential-vault to obtain API tokens'
            ]
          }
        }
      };

      const transformer = new ClaudeMdFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('## Technical Approach');
      expect(output).toContain('### Philosophy');
      expect(output).toContain('### Coding Style');
      expect(output).toContain('### Workflow');
      expect(output).toContain('#### Git And Github');
      expect(output).toContain('#### Credentials');
      expect(output).toContain('- Prefer bash commands over abstractions');
    });
  });

  describe('personality formatting', () => {
    it('should format personality as optional section', async () => {
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

      const transformer = new ClaudeMdFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('## Personality (Optional)');
      expect(output).toContain('**Assistant Persona**: JAX');
      expect(output).toContain('**Description**: Pseudo-anthropomorphic entity');
      expect(output).toContain('### Traits');
      expect(output).toContain('- Friendly personality with dry sense of humor');
    });
  });

  describe('project conventions formatting', () => {
    it('should format project conventions with subsections', async () => {
      const preferences = {
        project_conventions: {
          documentation: [
            'Sometimes save file artifacts named chat_bootstrap.md',
            'These represent context for subsequent chats'
          ],
          github_workflow: [
            'Use github-credential-vault to obtain API tokens',
            'Clone repos locally to work efficiently'
          ]
        }
      };

      const transformer = new ClaudeMdFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('## Project Conventions');
      expect(output).toContain('### Documentation');
      expect(output).toContain('### Github Workflow');
      expect(output).toContain('- Sometimes save file artifacts named chat_bootstrap.md');
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

      const transformer = new ClaudeMdFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('## Background');
      expect(output).toContain('- **Name**: John Doe');
      expect(output).toContain('- **Background**: 15 years software engineering');
      expect(output).toContain('### Interests');
      expect(output).toContain('- coding');
      expect(output).toContain('- music');
    });

    it('should handle legacy technical fields', async () => {
      const preferences = {
        technical: {
          philosophy: ['Clean code', 'Test-driven development'],
          style: 'Functional programming'
        }
      };

      const transformer = new ClaudeMdFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('## Technical Preferences');
      expect(output).toContain('### Philosophy');
      expect(output).toContain('- Clean code');
      expect(output).toContain('- **Style**: Functional programming');
    });
  });

  describe('section title formatting', () => {
    it('should convert snake_case to Title Case', async () => {
      const preferences = {
        technical_approach: {
          workflow: {
            git_and_github: ['Some content'],
            project_persistence: ['Some content'],
            issue_management: ['Some content']
          }
        }
      };

      const transformer = new ClaudeMdFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('#### Git And Github');
      expect(output).toContain('#### Project Persistence');
      expect(output).toContain('#### Issue Management');
    });
  });

  describe('output structure', () => {
    it('should produce well-structured markdown', async () => {
      const preferences = {
        professional_background: {
          experience: '15 years'
        },
        working_style: {
          communication: ['High-level summaries']
        }
      };

      const transformer = new ClaudeMdFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toMatch(/^# Working with \[Your Name\]/);
      expect(output).toContain('## Professional Background');
      expect(output).toContain('## Working Style');
      expect(output).toContain('### Communication Preferences');
      expect(output).toContain('- High-level summaries');
    });

    it('should handle empty sections gracefully', async () => {
      const transformer = new ClaudeMdFormatTransformer({});
      const output = await transformer.transform();

      expect(output).toBe('# Working with [Your Name]');
    });
  });

  describe('scope filtering', () => {
    it('should include both chat and global scoped content', async () => {
      const preferences = {
        professional_background: { // chat, global
          experience: '15 years'
        },
        working_style: { // chat, global, project
          communication: ['summaries']
        },
        technical_approach: { // global, project
          philosophy: ['clean code']
        },
        chat_only: {
          _scope: ['chat'],
          content: 'chat content'
        },
        global_only: {
          _scope: ['global'],
          content: 'global content'
        },
        project_only: {
          _scope: ['project'],
          content: 'project content'
        }
      };

      const transformer = new ClaudeMdFormatTransformer(preferences);
      const output = await transformer.transform();

      expect(output).toContain('15 years'); // professional_background
      expect(output).toContain('summaries'); // working_style
      expect(output).toContain('clean code'); // technical_approach
      expect(output).toContain('chat content'); // chat_only
      expect(output).toContain('global content'); // global_only
      expect(output).not.toContain('project content'); // project_only excluded
    });
  });

  describe('validation', () => {
    it('should validate successfully with content', () => {
      const preferences = {
        working_style: {
          communication: ['Some communication style']
        }
      };

      const transformer = new ClaudeMdFormatTransformer(preferences);
      const validation = transformer.validate();

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should fail validation with no global-scoped content', () => {
      const preferences = {
        project_only: {
          _scope: ['project'],
          content: 'project content'
        }
      };

      const transformer = new ClaudeMdFormatTransformer(preferences);
      const validation = transformer.validate();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('No sections found for global scope');
    });
  });
});