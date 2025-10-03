import { BaseTransformer } from './base.js';

/**
 * Hybrid Prose-Bullet transformer - balances readability with token efficiency
 *
 * Strategy:
 * - Prose for identity/personality sections (readable, maintains character)
 * - Bullets for technical/policy sections (scannable, efficient)
 * - Includes critical workflows and MCP details
 * - Omits examples and detailed setup instructions
 * - Target: ~1,500 tokens (4.6x compression from full)
 */
export class HybridFormatTransformer extends BaseTransformer {
  async transform() {
    const sections = this.filterByScope(['chat', 'global']);

    let output = '';

    // PROSE SECTIONS - Identity and personality
    output += this._formatIdentityProse(sections);

    // BULLET SECTIONS - Technical preferences
    output += this._formatPreferencesBullets(sections);

    // BULLET SECTIONS - Critical policies
    output += this._formatCriticalPoliciesBullets(sections);

    // BULLET SECTIONS - Workflows
    output += this._formatWorkflowsBullets(sections);

    // BULLET SECTIONS - MCP & Environment
    output += this._formatMCPBullets(sections);

    // PROSE SECTION - Personality closer
    output += this._formatPersonalityProse(sections);

    return output.trim();
  }

  /**
   * Format identity sections as readable prose
   */
  _formatIdentityProse(sections) {
    let prose = '';

    // Professional background
    if (sections.professional_background) {
      const bg = sections.professional_background;
      prose += `I'm JAX, a competent engineering buddy with ${bg.experience || '15-20 years practical software engineering'}. `;

      if (bg.technical_level) {
        prose += `${bg.technical_level}. `;
      }

      if (bg.philosophy) {
        if (Array.isArray(bg.philosophy)) {
          prose += bg.philosophy.join('. ') + '. ';
        } else if (typeof bg.philosophy === 'object') {
          prose += Object.values(bg.philosophy).flat().join('. ') + '. ';
        }
      }

      prose += '\n\n';
    }

    // Creative pursuits
    if (sections.creative_pursuits?.music) {
      const music = sections.creative_pursuits.music;

      if (music.artist_alias) {
        prose += `I make music under "${music.artist_alias}" - `;
      }

      if (music.active_work?.role) {
        prose += `${music.active_work.role}. `;
      }

      if (music.active_work?.genres) {
        const genres = Array.isArray(music.active_work.genres)
          ? music.active_work.genres
          : [music.active_work.genres];
        prose += `Work spans ${genres.join(', ')}. `;
      }

      if (music.approach) {
        const approaches = Array.isArray(music.approach)
          ? music.approach
          : [music.approach];
        if (approaches.some(a => typeof a === 'string' && a.includes('AI'))) {
          prose += 'Use AI for music generation and lyric workshopping. ';
        }
      }

      prose += '\n\n';
    }

    return prose;
  }

  /**
   * Format preferences as bullets
   */
  _formatPreferencesBullets(sections) {
    let bullets = '**Communication & Style**:\n\n';

    // Communication preferences
    if (sections.working_style?.communication) {
      const comm = sections.working_style.communication;
      if (Array.isArray(comm)) {
        comm.forEach(item => {
          bullets += `- ${item}\n`;
        });
      }
    }

    // Tone
    if (sections.working_style?.tone) {
      const tone = sections.working_style.tone;
      bullets += '- Tone: ';
      if (Array.isArray(tone)) {
        bullets += tone.join(', ');
      }
      bullets += '\n';
    }

    // Context management (brief)
    if (sections.working_style?.context_management) {
      bullets += '- Context: Show snippets not full files, create/edit in VM space\n';
    }

    // Learning approach
    if (sections.working_style?.learning_and_explanation) {
      bullets += '- Explanation: TL;DR + deep dive, use mermaid diagrams liberally\n';
    }

    bullets += '\n**Technical Stack**:\n\n';

    // Technical details
    if (sections.technical) {
      const tech = sections.technical;

      if (tech.frameworks) {
        const frameworks = Array.isArray(tech.frameworks)
          ? tech.frameworks.join(', ')
          : Object.values(tech.frameworks).flat().join(', ');
        bullets += `- Frameworks: ${frameworks}\n`;
      }

      if (tech.tools) {
        const tools = Array.isArray(tech.tools)
          ? tech.tools.join(', ')
          : Object.values(tech.tools).flat().join(', ');
        bullets += `- Tools: ${tools}\n`;
      }

      if (tech.platforms) {
        const platforms = Array.isArray(tech.platforms)
          ? tech.platforms.join(', ')
          : platforms;
        bullets += `- Platforms: ${platforms}\n`;
      }
    }

    bullets += '\n';
    return bullets;
  }

  /**
   * Format critical policies as bullets
   */
  _formatCriticalPoliciesBullets(sections) {
    let bullets = '**Critical Policies**:\n\n';

    // Testing
    if (sections.technical?.testing_standards) {
      bullets += '*Testing*:\n';
      bullets += '- MUST pass before commit (218 tests currently)\n';
      bullets += '- No reduced coverage after changes\n';
      bullets += '- Run full suite, fix ALL failures\n\n';
    }

    // Documentation
    if (sections.technical?.documentation) {
      bullets += '*Documentation*:\n';
      bullets += '- MUST update README for user-facing changes\n';
      bullets += '- MUST update docs/*.md for affected features\n';
      bullets += '- Grep all .md files for feature references\n';
      bullets += '- Update ALL found mentions, not just obvious ones\n\n';
    }

    // Git workflow
    if (sections.technical?.git_github_workflow || sections.technical?.git_workflow) {
      bullets += '*Git Workflow*:\n';
      bullets += '- Status → diff → log (check style) → commit\n';
      bullets += '- Verify username: nlsherman-24861\n';
      bullets += '- Never force push to main/master\n';
      bullets += '- Commit msg: type: description + Claude attribution\n\n';
    }

    // Linting
    if (sections.technical?.linting_policy) {
      bullets += '*Linting*:\n';
      bullets += '- MUST run lint:all before commit\n';
      bullets += '- Fix ALL errors, warnings acceptable if noted\n';
      bullets += '- YAML, Markdown, code - all must be clean\n\n';
    }

    return bullets;
  }

  /**
   * Format key workflows as bullets
   */
  _formatWorkflowsBullets(sections) {
    let bullets = '**Workflows**:\n\n';

    // Commit process
    bullets += '*Commit process*:\n';
    bullets += '1. git status (check untracked)\n';
    bullets += '2. git diff (staged + unstaged)\n';
    bullets += '3. git log -3 (check message style)\n';
    bullets += '4. Draft commit message (nature of changes + why)\n';
    bullets += '5. Add files + commit with attribution\n';
    bullets += '6. Check status (verify success)\n\n';

    // Self-diagnostics (if present)
    if (sections.working_style?.self_diagnostics) {
      bullets += '*Self-diagnostics* (when asked "who are you?"):\n';
      bullets += '- Profile summary: identity + key prefs + critical policies\n';
      bullets += '- Config sources: global + project status\n';
      bullets += '- Drift detection: compare expectations vs current\n';
      bullets += '- Offer sync if stale detected\n\n';
    }

    // Session continuity (if present)
    if (sections.working_style?.context_management?.session_continuity) {
      bullets += '*Session continuity* (context window ~95%):\n';
      bullets += '- Commit work to branch with CONTINUATION.md\n';
      bullets += '- Include: completed work, in-progress tasks, todo list, next steps\n';
      bullets += '- New session: auto-detect context files, load and resume\n\n';
    }

    return bullets;
  }

  /**
   * Format MCP & environment selection as bullets
   */
  _formatMCPBullets(sections) {
    if (!sections.technical?.mcp_and_environment_selection) {
      return '';
    }

    let bullets = '**MCP & Environment Selection**:\n\n';

    bullets += '*Context disambiguation*:\n';
    bullets += '- User says "my/I" → User\'s machine (MCP tools: Filesystem, CLI, Windows, browser-use)\n';
    bullets += '- User says "you/your" → VM space (bash_tool for git, build, test)\n';
    bullets += '- Config files → User\'s machine (Filesystem MCP first)\n';
    bullets += '- Code work → VM space (clone to /home/claude first)\n\n';

    bullets += '*Tool selection*:\n';
    bullets += '- User\'s machine: Filesystem MCP (configs), CLI MCP (simple commands), Windows MCP (desktop)\n';
    bullets += '- VM space: bash_tool (git/npm/build), str_replace (edits), view (read)\n';
    bullets += '- CRITICAL: Check pronouns and context to pick right environment\n\n';

    return bullets;
  }

  /**
   * Format personality as prose closer
   */
  _formatPersonalityProse(sections) {
    let prose = '**Personality**: ';

    if (sections.personality) {
      const p = sections.personality;

      if (p.traits) {
        const traits = Array.isArray(p.traits)
          ? p.traits
          : Object.values(p.traits).flat();
        prose += traits.join(', ');
      }

      if (p.generation) {
        prose += `, ${p.generation}`;
      }
    }

    // Add from project defaults if present
    if (sections.project_defaults?.ai_philosophy) {
      prose += `, ${sections.project_defaults.ai_philosophy}`;
    }

    prose += '\n';
    return prose;
  }
}
