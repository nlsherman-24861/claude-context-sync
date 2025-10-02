import { BaseTransformer } from './base.js';

/**
 * Transforms preferences into natural prose format for Claude Chat
 */
export class ChatFormatTransformer extends BaseTransformer {
  async transform() {
    const sections = this.filterByScope('chat');
    
    let output = '';

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

    // Personality
    if (sections.personality) {
      output += this._formatPersonality(sections.personality);
    }

    // Legacy field support
    if (sections.personal) {
      output += this._formatLegacyPersonal(sections.personal);
    }

    return output.trim();
  }

  _formatProfessionalBackground(background) {
    let text = '';
    
    if (background.experience) {
      text += `I'm a software engineer with ${background.experience}. `;
    }
    
    if (background.technical_level) {
      text += `I have a ${background.technical_level.toLowerCase()}. `;
    }

    if (background.philosophy && Array.isArray(background.philosophy)) {
      text += background.philosophy.join('. ') + '. ';
    }

    return text + '\n\n';
  }

  _formatPersonalInterests(interests) {
    let text = '';
    
    if (interests.primary && Array.isArray(interests.primary)) {
      text += `My interests include ${this._formatList(interests.primary)}. `;
    }

    if (interests.engagement_style && Array.isArray(interests.engagement_style)) {
      text += interests.engagement_style.join('. ') + '. ';
    }

    if (interests.generation) {
      text += `I'm ${interests.generation}. `;
    }

    return text ? text + '\n\n' : '';
  }

  _formatWorkingStyle(style) {
    let text = '';

    if (style.communication && Array.isArray(style.communication)) {
      text += 'I prefer ';
      text += this._formatList(style.communication, { lowercase: true });
      text += '. ';
    }

    if (style.feedback && Array.isArray(style.feedback)) {
      text += 'For feedback, I appreciate ';
      text += this._formatList(style.feedback, { lowercase: true });
      text += '. ';
    }

    if (style.learning && Array.isArray(style.learning)) {
      text += 'When learning, I ';
      text += this._formatList(style.learning, { lowercase: true });
      text += '. ';
    }

    return text ? text + '\n\n' : '';
  }

  _formatPersonality(personality) {
    let text = '';
    
    if (personality.construct_name) {
      text += `Think of yourself as "${personality.construct_name}"`;
      
      if (personality.description) {
        text += ` - ${personality.description}`;
      }
      text += '. ';
    }

    if (personality.traits && Array.isArray(personality.traits)) {
      text += `Your traits include: ${this._formatList(personality.traits, { lowercase: true })}. `;
    }

    return text ? text + '\n\n' : '';
  }

  _formatLegacyPersonal(personal) {
    let text = '';
    
    if (personal.background) {
      text += `I'm ${personal.background}. `;
    }

    if (personal.interests && Array.isArray(personal.interests)) {
      text += `My interests include ${this._formatList(personal.interests)}. `;
    }

    if (personal.name) {
      text += `My name is ${personal.name}. `;
    }

    return text ? text + '\n\n' : '';
  }

  /**
   * Format array items into natural prose list
   * @private
   */
  _formatList(items, options = {}) {
    if (!Array.isArray(items) || items.length === 0) {
      return '';
    }

    let processedItems = options.lowercase 
      ? items.map(item => item.charAt(0).toLowerCase() + item.slice(1))
      : items;

    if (processedItems.length === 1) {
      return processedItems[0];
    } else if (processedItems.length === 2) {
      return `${processedItems[0]} and ${processedItems[1]}`;
    } else {
      const lastItem = processedItems.pop();
      return `${processedItems.join(', ')}, and ${lastItem}`;
    }
  }

  validate() {
    const sections = this.filterByScope('chat');
    const errors = [];

    // Check if we have at least some content
    if (Object.keys(sections).length === 0) {
      errors.push('No sections found for chat scope');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}