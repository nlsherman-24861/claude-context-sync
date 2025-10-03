import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileExists, readYaml } from '../utils/fs.js';
import { validateBasicStructure } from '../parsers/yaml-parser.js';
import { DEFAULT_CONFIG_PATHS, DEFAULT_CONFIG } from './defaults.js';
import { deepMergeAll } from '../utils/deep-merge.js';
import { readdirSync } from 'fs';

export class ConfigNotFoundError extends Error {
  constructor(searchPaths) {
    const pathsStr = searchPaths.join(', ');
    super(`Config file not found. Searched: ${pathsStr}`);
    this.name = 'ConfigNotFoundError';
    this.searchPaths = searchPaths;
  }
}

export class ConfigValidationError extends Error {
  constructor(errors, filepath) {
    const errorList = errors.join(', ');
    super(`Config validation failed: ${errorList}`);
    this.name = 'ConfigValidationError';
    this.errors = errors;
    this.filepath = filepath;
  }
}

export async function findConfigFile(customPath = null) {
  const searchPaths = customPath 
    ? [customPath]
    : DEFAULT_CONFIG_PATHS;
  
  for (const path of searchPaths) {
    if (await fileExists(path)) {
      return path;
    }
  }
  
  throw new ConfigNotFoundError(searchPaths);
}

/**
 * Discover project-specific preference layer files
 * Looks for preferences.*.yaml files in .claude/ directory relative to base config
 *
 * Pattern: .claude/preferences.{layer-name}.yaml
 * Example: .claude/preferences.project-context.yaml, .claude/preferences.team-conventions.yaml
 *
 * This allows developers to add project-specific preferences independently of sync operations.
 * Files are merged alphabetically after the base config.
 *
 * @param {string} baseConfigPath - Path to base preferences.yaml
 * @returns {string[]} Sorted array of layer file paths (alphabetical)
 */
export function discoverProjectLayers(baseConfigPath) {
  const baseDir = dirname(baseConfigPath);

  // Look for .claude/ directory in same location as base config
  // If base is in project root, look in ./.claude/
  // If base is already in .claude/, look there
  const claudeDir = baseDir.endsWith('.claude') ? baseDir : join(baseDir, '.claude');

  const baseName = 'preferences.';
  const extension = '.yaml';

  try {
    const files = readdirSync(claudeDir);
    const layers = files
      .filter(f => {
        // Match preferences.*.yaml but NOT preferences.yaml itself
        return f.startsWith(baseName) &&
               f.endsWith(extension) &&
               f !== 'preferences.yaml';
      })
      .map(f => join(claudeDir, f))
      .sort(); // Alphabetical order

    return layers;
  } catch (error) {
    // Directory doesn't exist or can't be read - this is fine, layers are optional
    return [];
  }
}

export async function loadConfig(customPath = null, options = {}) {
  const { skipProjectLayers = false } = options;
  const configPath = await findConfigFile(customPath);

  try {
    // Load base config
    const baseConfig = await readYaml(configPath);

    // Validate basic structure
    const validation = validateBasicStructure(baseConfig);
    if (!validation.valid) {
      throw new ConfigValidationError(validation.errors, configPath);
    }

    // Discover and load project-specific layers (unless skipped)
    const layerPaths = skipProjectLayers ? [] : discoverProjectLayers(configPath);
    const layers = [];

    for (const layerPath of layerPaths) {
      try {
        const layerConfig = await readYaml(layerPath);
        layers.push(layerConfig);
      } catch (error) {
        // Log warning but don't fail - layer files are optional
        console.warn(`Warning: Failed to load preference layer ${layerPath}: ${error.message}`);
      }
    }

    // Merge: defaults + base + layer1 + layer2 + ...
    // Using deep merge with array append semantics
    const mergedConfig = deepMergeAll(
      DEFAULT_CONFIG,
      baseConfig,
      ...layers
    );

    return {
      config: mergedConfig,
      path: configPath,
      layers: layerPaths // Include layer paths for debugging/tooling
    };
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      throw error;
    }
    throw new Error(`Failed to load config from ${configPath}: ${error.message}`);
  }
}

export function mergeWithDefaults(userConfig) {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    personal: {
      ...DEFAULT_CONFIG.personal,
      ...userConfig.personal,
      working_style: {
        ...DEFAULT_CONFIG.personal.working_style,
        ...userConfig.personal?.working_style
      }
    },
    technical: {
      ...DEFAULT_CONFIG.technical,
      ...userConfig.technical
    },
    project_defaults: {
      ...DEFAULT_CONFIG.project_defaults,
      ...userConfig.project_defaults
    },
    claude_interfaces: {
      ...DEFAULT_CONFIG.claude_interfaces,
      ...userConfig.claude_interfaces,
      chat: {
        ...DEFAULT_CONFIG.claude_interfaces.chat,
        ...userConfig.claude_interfaces?.chat
      },
      code: {
        ...DEFAULT_CONFIG.claude_interfaces.code,
        ...userConfig.claude_interfaces?.code
      },
      projects: {
        ...DEFAULT_CONFIG.claude_interfaces.projects,
        ...userConfig.claude_interfaces?.projects
      }
    }
  };
}

export function getDefaultConfigPath() {
  return join(homedir(), '.config', 'claude', 'preferences.yaml');
}