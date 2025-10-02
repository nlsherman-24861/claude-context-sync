import { join } from 'path';
import { homedir } from 'os';
import { fileExists, readYaml } from '../utils/fs.js';
import { validateBasicStructure } from '../parsers/yaml-parser.js';
import { DEFAULT_CONFIG_PATHS, DEFAULT_CONFIG } from './defaults.js';

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

export async function loadConfig(customPath = null) {
  const configPath = await findConfigFile(customPath);
  
  try {
    const config = await readYaml(configPath);
    
    // Validate basic structure
    const validation = validateBasicStructure(config);
    if (!validation.valid) {
      throw new ConfigValidationError(validation.errors, configPath);
    }
    
    // Merge with defaults to ensure all required fields exist
    const mergedConfig = mergeWithDefaults(config);
    
    return {
      config: mergedConfig,
      path: configPath
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