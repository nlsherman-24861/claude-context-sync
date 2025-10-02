/**
 * Transformer registry and factory
 */
import { ChatFormatTransformer } from './chat-format.js';
import { ClaudeMdFormatTransformer } from './claude-md-format.js';

// Registry of available transformers
const TRANSFORMERS = {
  chat: ChatFormatTransformer,
  'claude-md': ClaudeMdFormatTransformer
};

/**
 * Create a transformer instance for the specified format
 * @param {string} format - Format name (chat, claude-md)
 * @param {Object} preferences - Preferences object to transform
 * @returns {BaseTransformer} Transformer instance
 */
export function createTransformer(format, preferences) {
  const TransformerClass = TRANSFORMERS[format];
  
  if (!TransformerClass) {
    throw new Error(`Unknown transformer format: ${format}. Available formats: ${Object.keys(TRANSFORMERS).join(', ')}`);
  }

  return new TransformerClass(preferences);
}

/**
 * Get list of available transformer formats
 * @returns {string[]} Array of format names
 */
export function getAvailableFormats() {
  return Object.keys(TRANSFORMERS);
}

/**
 * Check if a format is supported
 * @param {string} format - Format name to check
 * @returns {boolean} True if format is supported
 */
export function isFormatSupported(format) {
  return format in TRANSFORMERS;
}

// Export transformer classes for direct use
export { ChatFormatTransformer } from './chat-format.js';
export { ClaudeMdFormatTransformer } from './claude-md-format.js';
export { BaseTransformer } from './base.js';