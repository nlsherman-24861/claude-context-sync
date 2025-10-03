import { BaseTransformer } from './base.js';
import { limitDepth, smartCondense } from '../utils/depth-limit.js';

/**
 * Transforms preferences into natural prose format for Claude Chat
 */
export class ChatFormatTransformer extends BaseTransformer {
  async transform() {
    const sections = this.filterByScope(['chat', 'global']);

    let output = '';

    // Add framing context to clarify perspective and pronouns
    const personaName = sections.personality?.construct_name ||
                       sections.personality?.name ||
                       sections.personal?.name;

    if (personaName) {
      output += `Your name is ${personaName}. `;
    }

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

    // Working style (handles all subsections internally)
    if (sections.working_style) {
      output += this._formatWorkingStyle(sections.working_style);
    }

    // Personality (Claude's traits)
    if (sections.personality) {
      output += '\n[Your personality traits:] ';
      output += this._formatPersonality(sections.personality);
    }

    // Legacy field support
    if (sections.personal) {
      output += this._formatLegacyPersonal(sections.personal);
    }

    // Technical preferences (compacted)
    if (sections.technical) {
      output += this._formatTechnical(sections.technical);
    }

    // Project defaults (compacted)
    if (sections.project_defaults) {
      output += this._formatProjectDefaults(sections.project_defaults);
    }

    // Project-specific (ultra-condensed, depth 1 only)
    if (sections.project_specific) {
      output += this._formatProjectSpecific(sections.project_specific);
    }

    // Handle any unknown/custom sections generically
    const knownSections = new Set([
      'creative_pursuits', 'professional_background',
      'personal_interests',
      'working_style',
      'personality',
      'personal',
      'technical',
      'project_defaults',
      'project_specific', // Handled explicitly above
      'claude_interfaces', // Internal config, not for output
      'configurator_setup', // Tooling config, not for output
      'preference_sync' // Tooling config, not for output
    ]);

    for (const [key, value] of Object.entries(sections)) {
      if (!knownSections.has(key) && typeof value === 'object' && value !== null) {
        output += this._formatGenericSection(value);
      }
    }

    return output.trim();
  }

  _formatProfessionalBackground(background) {
    let text = '';

    if (background.experience) {
      text += `The user has ${background.experience}. `;
    }

    if (background.technical_level) {
      text += `${background.technical_level}. `;
    }

    if (background.philosophy && Array.isArray(background.philosophy)) {
      text += background.philosophy.join('. ') + '. ';
    }

    return text + '\n\n';
  }
n
  _formatCreativePursuits(pursuits) {
    let text = '';

    // Iterate over all creative pursuit types (music, writing, visual_arts, etc.)
    for (const [pursuitType, pursuitData] of Object.entries(pursuits)) {
      // Identity/alias field (artist_alias, pen_name, alias, etc.)
      const identityField = pursuitData.artist_alias || pursuitData.pen_name || pursuitData.alias;
      if (identityField) {
        text += `The user creates ${pursuitType} under "${identityField}". `;
      }

      // Passion/description
      if (pursuitData.passion) {
        text += `${pursuitData.passion}. `;
      }

      // Background
      if (pursuitData.background && Array.isArray(pursuitData.background)) {
        text += pursuitData.background.join('. ') + '. ';
      }

      // Active work
      if (pursuitData.active_work) {
        const work = pursuitData.active_work;

        if (work.role) {
          text += `The user is actively working as a ${work.role}. `;
        }

        if (work.genres && Array.isArray(work.genres)) {
          text += `The user's work spans ${this._formatList(work.genres)}. `;
        }

        if (work.approach && Array.isArray(work.approach)) {
          text += work.approach.join('. ') + '. ';
        }
      }

      // Engagement patterns
      if (pursuitData.engagement_patterns && Array.isArray(pursuitData.engagement_patterns)) {
        text += `The user regularly engages in discussions about ${pursuitType} including: `;
        text += this._formatList(pursuitData.engagement_patterns) + '. ';
      }
    }

    return text ? text + '\n\n' : '';
  }


  _formatPersonalInterests(interests) {
    let text = '';

    if (interests.primary && Array.isArray(interests.primary)) {
      text += `The user's interests include ${this._formatList(interests.primary)}. `;
    }

    if (interests.engagement_style && Array.isArray(interests.engagement_style)) {
      text += interests.engagement_style.join('. ') + '. ';
    }

    if (interests.generation) {
      text += `The user is ${interests.generation}. `;
    }

    return text ? text + '\n\n' : '';
  }

  _formatWorkingStyle(style) {
    let text = '';

    if (style.communication && Array.isArray(style.communication)) {
      text += 'The user prefers ';
      text += this._formatList(style.communication, { lowercase: true });
      text += '. ';
    }

    // Tone (compacted - just key traits)
    if (style.tone && Array.isArray(style.tone)) {
      const toneKey = style.tone.filter(t =>
        t.includes('humor') || t.includes('snark') || t.includes('Never pushy')
      ).map(t => t.toLowerCase().replace('never pushy or pandering', 'not pushy'));
      if (toneKey.length) {
        text += `Tone: ${toneKey.join(', ')}. `;
      }
    }

    if (style.feedback && Array.isArray(style.feedback)) {
      text += 'For feedback, the user appreciates ';
      text += this._formatList(style.feedback, { lowercase: true });
      text += '. ';
    }

    if (style.learning && Array.isArray(style.learning)) {
      text += 'When learning, the user ';
      text += this._formatList(style.learning, { lowercase: true });
      text += '. ';
    }

    // Learning approach (compacted)
    if (style.learning_approach && Array.isArray(style.learning_approach)) {
      text += `Approach: ${style.learning_approach.join(', ').toLowerCase()}. `;
    }

    // Context management (compacted)
    if (style.context_management) {
      const cm = style.context_management;
      const contextParts = [];
      if (cm.optimization) contextParts.push(...cm.optimization.slice(0, 2)); // First 2 optimization tips
      if (cm.semantic_compaction) contextParts.push('intelligent semantic compaction near limits');
      if (contextParts.length) {
        text += `Context: ${contextParts.join('; ')}. `;
      }
    }

    // Learning and explanation (compacted)
    if (style.learning_and_explanation) {
      const le = style.learning_and_explanation;
      const learnParts = [];
      if (le.structure) learnParts.push('TL;DR + deep dive');
      if (le.visual_aids) learnParts.push('use mermaid diagrams liberally');
      if (learnParts.length) {
        text += `Explanations: ${learnParts.join(', ')}. `;
      }
    }

    // Context awareness (critical for chat - compact but clear)
    if (style.context_awareness) {
      const ca = style.context_awareness;
      const awareParts = [];
      if (ca.project_vs_general) {
        awareParts.push('conversations often general/exploratory, not project-specific');
      }
      if (ca.adaptation) {
        awareParts.push('scale technical depth to actual context');
      }
      if (awareParts.length) {
        text += `Note: ${awareParts.join('; ')}. `;
      }
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
    
    // Persona framing (if name/role provided)
    if (personal.name || personal.role) {
      if (personal.name) {
        text += `Think of yourself as ${personal.name}`;
        if (personal.role) {
          text += `, ${personal.role.toLowerCase()}`;
        }
        if (personal.background) {
          text += ` (${personal.background.toLowerCase()})`;
        }
        text += '. ';
      } else if (personal.role) {
        text += `Your role: ${personal.role}. `;
      }
    } else if (personal.background) {
      // If no name/role, just output background
      text += `${personal.background}. `;
    }

    if (personal.interests && Array.isArray(personal.interests)) {
      text += `Shared interests: ${this._formatList(personal.interests, { lowercase: true })}. `;
    }

    if (personal.generation) {
      text += `${personal.generation}. `;
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

  /**
   * Format technical preferences with semantic compaction
   * @private
   */
  _formatTechnical(technical) {
    let text = '';
    const parts = [];

    // Language preferences
    if (technical.language_preferences) {
      const langs = technical.language_preferences;
      if (langs.background && langs.current) {
        parts.push(`background in ${this._formatList(langs.background)}, currently working with ${this._formatList(langs.current)}`);
      } else if (langs.current) {
        parts.push(`work with ${this._formatList(langs.current)}`);
      }
    }

    // Frameworks, tools, platforms (compact)
    const tools = [];
    if (technical.frameworks?.length) tools.push(`frameworks: ${technical.frameworks.join(', ')}`);
    if (technical.tools?.length) tools.push(`tools: ${technical.tools.join(', ')}`);
    if (technical.platforms?.length) tools.push(`platforms: ${technical.platforms.join(', ')}`);
    if (tools.length) parts.push(tools.join('; '));

    // Testing standards (critical, so include key points)
    if (technical.testing_standards) {
      const ts = technical.testing_standards;
      const testRules = [];
      if (ts.core_requirements) testRules.push(...ts.core_requirements.slice(0, 2)); // First 2 rules
      if (ts.execution_requirements) testRules.push(ts.execution_requirements[0]); // First execution rule
      if (testRules.length) parts.push(`Testing: ${testRules.join('; ')}`);
    }

    // Best practices (compact key items)
    if (technical.best_practices) {
      const bp = technical.best_practices;
      const practices = [];
      if (bp.escaping) practices.push('thorough escaping for CLI/regex/sed');
      if (bp.cross_platform) practices.push('cross-platform compatible (Win/Mac/Linux)');
      if (practices.length) parts.push(practices.join(', '));
    }

    // Agent collaboration (key patterns)
    if (technical.agent_collaboration) {
      const ac = technical.agent_collaboration;
      const agentInfo = [];
      if (ac.mention_patterns) agentInfo.push('@claude mentions in GitHub Actions');
      if (ac.pr_creation) agentInfo.push('auto-PR on completion');
      if (ac.terminology) agentInfo.push('refer to remote instances as "agent"');
      if (agentInfo.length) parts.push(`Agent collab: ${agentInfo.join(', ')}`);
    }

    // Git authentication (critical for Claude instances)
    if (technical.git_authentication) {
      const ga = technical.git_authentication;
      if (ga.environment_pattern) {
        parts.push('Git auth: Environment provides github-credential-vault MCP (list_profiles → authenticate_github → push). High-stakes operation - explicit guidance prevents trial-and-error.');
      }
    }

    // Git commit discipline (CRITICAL for auto git operations)
    if (technical.git_commit_discipline) {
      parts.push('Git reverts: NEVER revert without reading commit diff/message; ask user before destructive ops; revert messages must explain what/why/what\'s lost; default fix forward not backward');
    }

    // File operations (ultra-condensed - just key facts)
    if (technical.file_operations?.opening_files) {
      const fileOps = technical.file_operations.opening_files;
      const compact = new Set(); // Use Set to deduplicate

      // Extract just the commands, not the explanations
      for (const op of fileOps) {
        if (op.includes('Windows:') && op.includes('explorer') && !compact.has('win')) {
          compact.add('Win: explorer "file:///path" (exit 1 OK)');
          compact.add('win'); // Mark as added
        } else if (op.includes('macOS:') && op.includes('open') && !compact.has('mac')) {
          compact.add('Mac: open "path"');
          compact.add('mac'); // Mark as added
        } else if (op.includes('Linux:') && op.includes('xdg-open') && !compact.has('linux')) {
          compact.add('Linux: xdg-open "path"');
          compact.add('linux'); // Mark as added
        }
      }

      // Filter out the marker strings (win, mac, linux) and get actual commands
      const commands = Array.from(compact).filter(c => c.includes(':'));
      if (commands.length) {
        parts.push(`File open: ${commands.join(', ')}`);
      }
    }

    // Assemble with smart punctuation
    if (parts.length) {
      text = 'Technical: ' + parts.join('. ') + '.';
    }

    return text ? text + '\n\n' : '';
  }

  /**
   * Format project defaults with semantic compaction
   * @private
   */
  _formatProjectDefaults(defaults) {
    let text = '';
    const parts = [];

    // Git workflow
    if (defaults.git_workflow) {
      const gw = defaults.git_workflow;
      const gitParts = [];
      if (gw.commit_style) gitParts.push(`commits: ${gw.commit_style}`);
      if (gw.branch_strategy) gitParts.push(`branching: ${gw.branch_strategy}`);
      if (gw.pr_preferences) gitParts.push(`PRs: ${gw.pr_preferences.join(', ')}`);
      if (gitParts.length) parts.push(`Git: ${gitParts.join('; ')}`);
    }

    // Code quality
    if (defaults.code_quality) {
      const cq = defaults.code_quality;
      if (cq.principles) parts.push(`Quality: ${cq.principles.join(', ')}`);
    }

    // Documentation
    if (defaults.documentation_level) {
      parts.push(`Docs: ${defaults.documentation_level}`);
    }

    // Timeboxing philosophy
    if (defaults.timeboxing_and_completion?.philosophy) {
      parts.push(`Approach: ${defaults.timeboxing_and_completion.philosophy.join('; ')}`);
    }

    // Repository setup
    if (defaults.repository_setup) {
      const setupInfo = defaults.repository_setup.find(item => item.includes('claude-actions-setup'));
      if (setupInfo) parts.push('Prefer claude-actions-setup for new repos');
    }

    if (parts.length) {
      text = 'Defaults: ' + parts.join('. ') + '.';
    }

    return text ? text + '\n\n' : '';
  }

  /**
   * Format generic/unknown sections as natural prose
   * @private
   */
  _formatGenericSection(section) {
    let text = '';

    for (const [key, value] of Object.entries(section)) {
      // Skip internal fields
      if (key.startsWith('_')) continue;

      if (typeof value === 'string') {
        text += `${value} `;
      } else if (Array.isArray(value)) {
        text += `${this._formatList(value)}. `;
      } else if (typeof value === 'object' && value !== null) {
        // Recursively handle nested objects
        text += this._formatGenericSection(value);
      }
    }

    return text ? text + '\n\n' : '';
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

  /**
   * Format project-specific section (ultra-condensed, depth 1 only)
   * Chat format has tight token budget, so only top-level keys with smart condensing
   */
  _formatProjectSpecific(projectSpecific) {
    // Limit to depth 1 (top-level keys only)
    const limited = limitDepth(projectSpecific, 1);

    const parts = [];

    for (const [key, value] of Object.entries(limited)) {
      const keyName = key.replace(/_/g, ' ');
      const condensed = smartCondense(value);
      parts.push(`${keyName}: ${condensed}`);
    }

    if (parts.length === 0) return '';

    return `Project: ${parts.join('; ')}. `;
  }
}