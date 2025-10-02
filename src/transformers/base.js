/**
 * Base transformer class for converting preferences to different output formats
 */
export class BaseTransformer {
  constructor(preferences) {
    this.preferences = preferences;
  }

  /**
   * Filter sections by scope (chat, global, project)
   * @param {string|string[]} scope - Scope(s) to filter for
   * @returns {Object} Filtered preferences object
   */
  filterByScope(scope) {
    const targetScopes = Array.isArray(scope) ? scope : [scope];
    const filtered = {};

    for (const [key, value] of Object.entries(this.preferences)) {
      if (this._shouldIncludeSection(key, value, targetScopes)) {
        filtered[key] = value;
      }
    }

    return filtered;
  }

  /**
   * Check if a section should be included based on scope
   * @private
   */
  _shouldIncludeSection(key, value, targetScopes) {
    // Skip non-object values
    if (!value || typeof value !== 'object') {
      return false;
    }

    // If section has explicit _scope, use it
    if (value._scope && Array.isArray(value._scope)) {
      return value._scope.some(s => targetScopes.includes(s));
    }

    // Default scope rules based on section name
    const defaultScopes = this._getDefaultScopes(key);
    return defaultScopes.some(s => targetScopes.includes(s));
  }

  /**
   * Get default scopes for sections without explicit _scope
   * @private
   */
  _getDefaultScopes(sectionName) {
    const scopeMap = {
      // Chat and global scopes
      professional_background: ['chat', 'global'],
      personal_interests: ['chat', 'global'],
      personality: ['chat', 'global'],
      
      // All scopes
      working_style: ['chat', 'global', 'project'],
      
      // Global and project scopes
      technical_approach: ['global', 'project'],
      project_conventions: ['global', 'project'],
      
      // Legacy field mappings
      personal: ['chat', 'global'],
      technical: ['global', 'project']
    };

    return scopeMap[sectionName] || ['global']; // Default to global if unknown
  }

  /**
   * Transform preferences to target format
   * Must be implemented by subclasses
   * @returns {Promise<string>} Formatted output
   */
  async transform() {
    throw new Error('transform() must be implemented by subclasses');
  }

  /**
   * Validate that required sections exist for this format
   * @returns {Object} Validation result with {valid: boolean, errors: string[]}
   */
  validate() {
    return { valid: true, errors: [] };
  }
}