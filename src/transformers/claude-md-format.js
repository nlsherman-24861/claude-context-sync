import { BaseTransformer } from './base.js';

/**
 * Transforms preferences into structured markdown format for CLAUDE.md files
 */
export class ClaudeMdFormatTransformer extends BaseTransformer {
  async transform() {
    const sections = this.filterByScope(['chat', 'global']);
    
    let output = '# Working with [Your Name]\n\n';

    // Professional background
    if (sections.professional_background) {
      output += this._formatProfessionalBackground(sections.professional_background);
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
      'professional_background', 'personal_interests', 'working_style', 
      'technical_approach', 'project_conventions', 'personality', 
      'personal', 'technical'
    ]);

    for (const [key, value] of Object.entries(sections)) {
      if (!knownSections.has(key)) {
        output += this._formatGenericSection(key, value);
      }
    }

    return output.trim();
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
        value.forEach(item => {
          section += `- ${item}\n`;
        });
        section += '\n';
      } else if (typeof value === 'string') {
        section += `- **${this._formatSectionTitle(key)}**: ${value}\n`;
      }
    }

    return section + '\n';
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
          propValue.forEach(item => {
            section += `- ${item}\n`;
          });
          section += '\n';
        } else if (typeof propValue === 'string') {
          section += `- **${this._formatSectionTitle(propKey)}**: ${propValue}\n`;
        } else if (typeof propValue === 'object' && propValue !== null) {
          // Handle nested objects (like workflow)
          section += `### ${this._formatSectionTitle(propKey)}\n\n`;
          for (const [nestedKey, nestedValue] of Object.entries(propValue)) {
            if (Array.isArray(nestedValue)) {
              section += `#### ${this._formatSectionTitle(nestedKey)}\n\n`;
              nestedValue.forEach(item => {
                section += `- ${item}\n`;
              });
              section += '\n';
            }
          }
        }
      }
    }
    
    return section;
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