/**
 * Utility for limiting object nesting depth
 *
 * Used to create tiered transformations where different formats include
 * different levels of detail based on their token budgets:
 * - claude-md: unlimited depth (full detail)
 * - hybrid: depth 2 (top-level + one sublevel)
 * - chat: depth 1 (top-level only)
 */

/**
 * Check if value is a plain object (not array, not null)
 */
function isPlainObject(obj) {
  return obj !== null
    && typeof obj === 'object'
    && !Array.isArray(obj)
    && Object.getPrototypeOf(obj) === Object.prototype;
}

/**
 * Limit object nesting depth, condensing deeper values
 *
 * @param {*} obj - Object to limit depth
 * @param {number} maxDepth - Maximum depth to preserve (1 = top-level only)
 * @param {number} currentDepth - Current depth (internal, starts at 0)
 * @returns {*} Object with depth limited
 *
 * @example
 * const deep = {
 *   a: {
 *     b: {
 *       c: "deep value"
 *     }
 *   }
 * };
 *
 * limitDepth(deep, 1) // { a: "[nested object]" }
 * limitDepth(deep, 2) // { a: { b: "[nested object]" } }
 * limitDepth(deep, 3) // { a: { b: { c: "deep value" } } }
 */
export function limitDepth(obj, maxDepth, currentDepth = 0) {
  // Base case: not an object, return as-is
  if (!isPlainObject(obj)) {
    return obj;
  }

  // At max depth: condense nested objects
  if (currentDepth >= maxDepth) {
    return condenseValue(obj);
  }

  // Recurse into object properties
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isPlainObject(value)) {
      // Recurse into nested object
      result[key] = limitDepth(value, maxDepth, currentDepth + 1);
    } else if (Array.isArray(value)) {
      // Process array items
      result[key] = value.map(item =>
        isPlainObject(item)
          ? limitDepth(item, maxDepth, currentDepth + 1)
          : item
      );
    } else {
      // Primitive value, keep as-is
      result[key] = value;
    }
  }

  return result;
}

/**
 * Condense a value to a brief representation
 * Used when depth limit is exceeded
 *
 * @param {*} value - Value to condense
 * @returns {string} Condensed representation
 */
export function condenseValue(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.length === 1) return String(value[0]);

    // For arrays with multiple items, try to create a summary
    const firstItem = value[0];
    if (typeof firstItem === 'string') {
      // String array: join first few items
      const preview = value.slice(0, 2).join(', ');
      return value.length > 2 ? `${preview}...` : preview;
    }

    return `[${value.length} items]`;
  }

  if (isPlainObject(value)) {
    const keys = Object.keys(value);
    if (keys.length === 0) return '{}';
    if (keys.length === 1) {
      const key = keys[0];
      const val = value[key];
      // Single key-value: try to condense to "key: value" or just value
      if (typeof val === 'string' && val.length < 50) {
        return val;
      }
    }
    return `[${keys.length} fields]`;
  }

  if (typeof value === 'string') {
    // Long strings: truncate
    return value.length > 100 ? value.substring(0, 97) + '...' : value;
  }

  return String(value);
}

/**
 * Smart condense - creates readable summary from nested structure
 * Tries to preserve first-level keys while condensing values
 *
 * @param {Object} obj - Object to condense
 * @returns {string} Human-readable summary
 */
export function smartCondense(obj) {
  if (!isPlainObject(obj)) {
    return condenseValue(obj);
  }

  const keys = Object.keys(obj);
  if (keys.length === 0) return '{}';

  // Create key: value summary
  const parts = keys.slice(0, 3).map(key => {
    const value = obj[key];
    const condensed = condenseValue(value);
    return `${key}: ${condensed}`;
  });

  let result = parts.join('; ');
  if (keys.length > 3) {
    result += `... (${keys.length - 3} more)`;
  }

  return result;
}
