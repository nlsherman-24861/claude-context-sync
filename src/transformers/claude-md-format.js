import { BaseTransformer } from './base.js';

/**
 * Transforms preferences into structured markdown format for CLAUDE.md files
 */
export class ClaudeMdFormatTransformer extends BaseTransformer {
  async transform() {
    const sections = this.filterByScope(['chat', 'global']);
    
    let output = '# Claude Code Preferences\n\n';

    // Professional background
    if (sections.professional_background) {
      output += this._formatProfessionalBackground(sections.professional_background);
    }
    // Creative pursuits
    if (sections.creative_pursuits) {
      output += this._formatCreativePursuits(sections.creative_pursuits);
    }

    // Personal interests
    if (sections.personal_interests) {
      output += this._formatPersonalInterests(sections.personal_interests);
    }

    // Working style
    if (sections.working_style) {
      output += this._formatWorkingStyle(sections.working_style);
    }

    // Technical approach
    if (sections.technical_approach) {
      output += this._formatTechnicalApproach(sections.technical_approach);
    }

    // Project conventions
    if (sections.project_conventions) {
      output += this._formatProjectConventions(sections.project_conventions);
    }

    // Personality (optional section)
    if (sections.personality) {
      output += this._formatPersonality(sections.personality);
    }

    // Legacy field support
    if (sections.personal) {
      output += this._formatLegacyPersonal(sections.personal);
    }

    if (sections.technical) {
      output += this._formatLegacyTechnical(sections.technical);
    }

    // Handle any unknown/custom sections
    const knownSections = new Set([
      'creative_pursuits', 'professional_background', 'personal_interests', 'working_style',
      'technical_approach', 'project_conventions', 'personality',
      'personal', 'technical', 'project_defaults'
    ]);

    for (const [key, value] of Object.entries(sections)) {
      if (!knownSections.has(key)) {
        output += this._formatGenericSection(key, value);
      }
    }

    // Clean up: trim trailing spaces from each line, remove multiple blank lines, ensure single final newline
    return output
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n';
  }

  _formatProfessionalBackground(background) {
    let section = '## Professional Background\n\n';
    
    if (background.experience) {
      section += `- **Experience**: ${background.experience}\n`;
    }
    
    if (background.technical_level) {
      section += `- **Technical Level**: ${background.technical_level}\n`;
    }

    if (background.philosophy && Array.isArray(background.philosophy)) {
      section += '\n### Philosophy\n\n';
      background.philosophy.forEach(item => {
        section += `- ${item}\n`;
      });
    }

    return section + '\n';
  }
n
  _formatCreativePursuits(pursuits) {
    let section = '## Creative Pursuits\n\n';

    // Iterate over all pursuit types (music, writing, visual_arts, etc.)
    for (const [pursuitType, pursuitData] of Object.entries(pursuits)) {
      // Capitalize pursuit type for heading
      const pursuitLabel = pursuitType.charAt(0).toUpperCase() + pursuitType.slice(1).replace(/_/g, ' ');
      section += `### ${pursuitLabel}\n\n`;

      // Identity field (artist_alias, pen_name, alias, etc.)
      const identityField = pursuitData.artist_alias || pursuitData.pen_name || pursuitData.alias;
      const identityLabel = pursuitData.artist_alias ? 'Artist Alias' :
                           pursuitData.pen_name ? 'Pen Name' :
                           pursuitData.alias ? 'Alias' : null;
      if (identityField && identityLabel) {
        section += `**${identityLabel}**: ${identityField}\n\n`;
      }

      // Passion/description
      if (pursuitData.passion) {
        section += `${pursuitData.passion}\n\n`;
      }

      // Background
      if (pursuitData.background && Array.isArray(pursuitData.background)) {
        section += '**Background**:\n\n';
        pursuitData.background.forEach(item => {
          section += `- ${item}\n`;
        });
        section += '\n';
      }

      // Active work
      if (pursuitData.active_work) {
        const work = pursuitData.active_work;
        section += '**Active Work**:\n\n';

        if (work.role) {
          section += `- **Role**: ${work.role}\n`;
        }

        if (work.genres && Array.isArray(work.genres)) {
          section += '- **Genres**: ' + work.genres.join(', ') + '\n';
        }

        if (work.approach && Array.isArray(work.approach)) {
          section += '\n**Approach**:\n\n';
          work.approach.forEach(item => {
            section += `- ${item}\n`;
          });
        }

        section += '\n';
      }

      // Engagement patterns
      if (pursuitData.engagement_patterns && Array.isArray(pursuitData.engagement_patterns)) {
        section += '**Engagement Patterns**:\n\n';
        pursuitData.engagement_patterns.forEach(item => {
          section += `- ${item}\n`;
        });
        section += '\n';
      }
    }

    return section;
  }


  _formatPersonalInterests(interests) {
    let section = '## Personal Interests\n\n';
    
    if (interests.primary && Array.isArray(interests.primary)) {
      section += '### Primary Interests\n\n';
      interests.primary.forEach(item => {
        section += `- ${item}\n`;
      });
      section += '\n';
    }

    if (interests.engagement_style && Array.isArray(interests.engagement_style)) {
      section += '### Engagement Style\n\n';
      interests.engagement_style.forEach(item => {
        section += `- ${item}\n`;
      });
      section += '\n';
    }

    if (interests.generation) {
      section += `**Generation**: ${interests.generation}\n\n`;
    }

    return section;
  }

  _formatWorkingStyle(style) {
    let section = '## Working Style\n\n';

    if (style.communication && Array.isArray(style.communication)) {
      section += '### Communication Preferences\n\n';
      style.communication.forEach(item => {
        section += `- ${item}\n`;
      });
      section += '\n';
    }

    if (style.context_management && Array.isArray(style.context_management)) {
      section += '### Context Management\n\n';
      style.context_management.forEach(item => {
        section += `- ${item}\n`;
      });
      section += '\n';
    }

    if (style.feedback && Array.isArray(style.feedback)) {
      section += '### Feedback Style\n\n';
      style.feedback.forEach(item => {
        section += `- ${item}\n`;
      });
      section += '\n';
    }

    if (style.learning && Array.isArray(style.learning)) {
      section += '### Learning Approach\n\n';
      style.learning.forEach(item => {
        section += `- ${item}\n`;
      });
      section += '\n';
    }

    return section;
  }

  _formatTechnicalApproach(technical) {
    let section = '## Technical Approach\n\n';

    if (technical.philosophy && Array.isArray(technical.philosophy)) {
      section += '### Philosophy\n\n';
      technical.philosophy.forEach(item => {
        section += `- ${item}\n`;
      });
      section += '\n';
    }

    if (technical.coding_style && Array.isArray(technical.coding_style)) {
      section += '### Coding Style\n\n';
      technical.coding_style.forEach(item => {
        section += `- ${item}\n`;
      });
      section += '\n';
    }

    if (technical.workflow) {
      section += '### Workflow\n\n';
      section += this._formatWorkflowSection(technical.workflow);
    }

    return section;
  }

  _formatWorkflowSection(workflow) {
    let workflowContent = '';
    for (const [key, value] of Object.entries(workflow)) {
      if (Array.isArray(value)) {
        workflowContent += `#### ${this._formatSectionTitle(key)}\n\n`;
        value.forEach(item => {
          workflowContent += `- ${item}\n`;
        });
        workflowContent += '\n';
      }
    }
    return workflowContent;
  }

  _formatProjectConventions(conventions) {
    let section = '## Project Conventions\n\n';

    for (const [key, value] of Object.entries(conventions)) {
      if (Array.isArray(value)) {
        section += `### ${this._formatSectionTitle(key)}\n\n`;
        value.forEach(item => {
          section += `- ${item}\n`;
        });
        section += '\n';
      }
    }

    return section;
  }

  _formatPersonality(personality) {
    let section = '## Personality (Optional)\n\n';
    
    if (personality.construct_name) {
      section += `**Assistant Persona**: ${personality.construct_name}\n\n`;
    }

    if (personality.description) {
      section += `**Description**: ${personality.description}\n\n`;
    }

    if (personality.traits && Array.isArray(personality.traits)) {
      section += '### Traits\n\n';
      personality.traits.forEach(trait => {
        section += `- ${trait}\n`;
      });
      section += '\n';
    }

    return section;
  }

  _formatLegacyPersonal(personal) {
    let section = '## Background\n\n';
    
    if (personal.name) {
      section += `- **Name**: ${personal.name}\n`;
    }
    
    if (personal.background) {
      section += `- **Background**: ${personal.background}\n`;
    }

    if (personal.interests && Array.isArray(personal.interests)) {
      section += '\n### Interests\n\n';
      personal.interests.forEach(interest => {
        section += `- ${interest}\n`;
      });
    }

    return section + '\n';
  }

  _formatLegacyTechnical(technical) {
    let section = '## Technical Preferences\n\n';

    for (const [key, value] of Object.entries(technical)) {
      if (Array.isArray(value)) {
        section += `### ${this._formatSectionTitle(key)}\n\n`;

        // Check if content has structured indentation
        const hasIndentation = value.some(item => {
          const trimmed = item.trim();
          return trimmed && item.startsWith('  ') && !item.startsWith('- ');
        });

        if (hasIndentation) {
          // Format as nested markdown lists preserving structure
          value.forEach(item => {
            const trimmed = item.trim();
            if (!trimmed) {
              // Skip completely empty lines
              return;
            }

            // Count leading spaces to determine nesting level
            const leadingSpaces = item.search(/\S/);
            if (leadingSpaces === -1) return; // Empty line

            // Convert indentation to markdown nesting (2 spaces per level)
            const indent = '  '.repeat(Math.floor(leadingSpaces / 2));
            section += `${indent}- ${trimmed}\n`;
          });
          section += '\n';
        } else {
          // Format as simple list
          value.forEach(item => {
            const trimmed = item.trim();
            if (trimmed) {
              section += `- ${trimmed}\n`;
            }
          });
          section += '\n';
        }
      } else if (typeof value === 'string') {
        section += `- **${this._formatSectionTitle(key)}**: ${value}\n`;
      } else if (typeof value === 'object' && value !== null) {
        // Handle nested objects (testing_standards, linting_policy, documentation)
        section += this._formatNestedTechnicalSection(key, value);
      }
    }

    return section + '\n';
  }

  /**
   * Format nested technical sections (testing_standards, linting_policy, etc.)
   * @private
   */
  _formatNestedTechnicalSection(key, obj) {
    let section = `### ${this._formatSectionTitle(key)}\n\n`;

    for (const [propKey, propValue] of Object.entries(obj)) {
      if (typeof propValue === 'string') {
        section += `**${this._formatSectionTitle(propKey)}**: ${propValue}\n\n`;
      } else if (Array.isArray(propValue)) {
        section += `**${this._formatSectionTitle(propKey)}**:\n\n`;
        propValue.forEach(item => {
          section += `- ${item}\n`;
        });
        section += '\n';
      } else if (typeof propValue === 'object' && propValue !== null) {
        section += `**${this._formatSectionTitle(propKey)}**:\n\n`;
        for (const [subKey, subValue] of Object.entries(propValue)) {
          if (typeof subValue === 'string') {
            section += `- ${this._formatSectionTitle(subKey)}: ${subValue}\n`;
          } else if (Array.isArray(subValue)) {
            section += `- ${this._formatSectionTitle(subKey)}:\n`;
            subValue.forEach(item => {
              section += `  - ${item}\n`;
            });
          }
        }
        section += '\n';
      }
    }

    return section;
  }

  /**
   * Format a generic/unknown section
   * @private
   */
  _formatGenericSection(key, value) {
    let section = `## ${this._formatSectionTitle(key)}\n\n`;
    
    if (typeof value === 'string') {
      section += `${value}\n\n`;
    } else if (typeof value === 'object' && value !== null) {
      // Handle objects with properties
      for (const [propKey, propValue] of Object.entries(value)) {
        // Skip scope metadata
        if (propKey === '_scope') continue;
        
        if (Array.isArray(propValue)) {
          section += `### ${this._formatSectionTitle(propKey)}\n\n`;

          // Check if content has structured indentation
          const hasIndentation = propValue.some(item => {
            const trimmed = item.trim();
            return trimmed && item.startsWith('  ') && !item.startsWith('- ');
          });

          if (hasIndentation) {
            // Format as nested markdown lists preserving structure
            propValue.forEach(item => {
              const trimmed = item.trim();
              if (!trimmed) {
                // Skip completely empty lines
                return;
              }

              // Count leading spaces to determine nesting level
              const leadingSpaces = item.search(/\S/);
              if (leadingSpaces === -1) return; // Empty line

              // Convert indentation to markdown nesting (2 spaces per level)
              const indent = '  '.repeat(Math.floor(leadingSpaces / 2));
              section += `${indent}- ${trimmed}\n`;
            });
            section += '\n';
          } else {
            // Format as simple list
            propValue.forEach(item => {
              const trimmed = item.trim();
              if (trimmed) {
                section += `- ${trimmed}\n`;
              }
            });
            section += '\n';
          }
        } else if (typeof propValue === 'string') {
          section += `- **${this._formatSectionTitle(propKey)}**: ${propValue}\n`;
        } else if (typeof propValue === 'object' && propValue !== null) {
          // Handle nested objects (like workflow)
          section += `### ${this._formatSectionTitle(propKey)}\n\n`;
          for (const [nestedKey, nestedValue] of Object.entries(propValue)) {
            if (Array.isArray(nestedValue)) {
              section += `#### ${this._formatSectionTitle(nestedKey)}\n\n`;
              nestedValue.forEach(item => {
                // Trim trailing spaces and skip empty lines
                const trimmed = item.trim();
                if (trimmed) {
                  section += `- ${trimmed}\n`;
                }
              });
              section += '\n';
            }
          }
        }
      }
    }

    return section + '\n';
  }

  /**
   * Convert snake_case to Title Case
   * @private
   */
  _formatSectionTitle(title) {
    return title
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  validate() {
    const sections = this.filterByScope(['chat', 'global']);
    const errors = [];

    // Check if we have at least some content
    if (Object.keys(sections).length === 0) {
      errors.push('No sections found for global scope');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}