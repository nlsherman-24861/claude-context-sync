/**
 * Deep merge utility with array append semantics
 *
 * Merges objects deeply, with special handling for arrays:
 * - Arrays are appended (concatenated) rather than replaced
 * - Objects are merged recursively
 * - Primitives are replaced (last wins)
 *
 * This allows preference layers to be additive:
 * - Base layer: core_requirements: ["Test A", "Test B"]
 * - Project layer: core_requirements: ["Test C"]
 * - Result: core_requirements: ["Test A", "Test B", "Test C"]
 */

/**
 * Check if value is a plain object (not array, not null, not class instance)
 */
function isPlainObject(obj) {
  return obj !== null
    && typeof obj === 'object'
    && !Array.isArray(obj)
    && Object.getPrototypeOf(obj) === Object.prototype;
}

/**
 * Deep merge two objects with array append semantics
 *
 * @param {Object} target - Base object
 * @param {Object} source - Object to merge into base
 * @returns {Object} Merged object (creates new object, doesn't mutate inputs)
 */
export function deepMerge(target, source) {
  // Handle non-object cases
  if (!isPlainObject(target) || !isPlainObject(source)) {
    return source !== undefined ? source : target;
  }

  const result = { ...target };

  for (const key of Object.keys(source)) {
    const targetValue = target[key];
    const sourceValue = source[key];

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      // Array append - concatenate arrays
      result[key] = [...targetValue, ...sourceValue];
    } else if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      // Recurse for nested objects
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      // Primitive or type mismatch - source wins
      result[key] = sourceValue;
    }
  }

  return result;
}

/**
 * Merge multiple objects in order (left to right)
 *
 * @param {...Object} objects - Objects to merge
 * @returns {Object} Merged result
 */
export function deepMergeAll(...objects) {
  return objects.reduce((acc, obj) => deepMerge(acc, obj), {});
}
