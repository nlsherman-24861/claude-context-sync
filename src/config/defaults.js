import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');

export const DEFAULT_CONFIG_PATHS = [
  process.env.CLAUDE_CONTEXT_CONFIG,
  join(homedir(), '.config', 'claude', 'preferences.yaml'),
  join(homedir(), '.claude', 'preferences.yaml'),
  join(projectRoot, 'default-preferences.yaml'),
].filter(Boolean);

export const DEFAULT_CONFIG = {
  personal: {
    name: '',
    role: '',
    experience_level: '',
    communication_style: '',
    expertise_areas: [],
    learning_goals: [],
    working_style: {
      collaboration: '',
      code_review: '',
      documentation: '',
      testing: ''
    }
  },
  technical: {
    preferred_languages: [],
    frameworks: [],
    tools: [],
    platforms: []
  },
  project_defaults: {
    git_workflow: '',
    code_style: '',
    testing_approach: '',
    documentation_level: ''
  },
  claude_interfaces: {
    chat: {
      enabled: true,
      sync_frequency: 'manual'
    },
    code: {
      enabled: true,
      sync_frequency: 'manual'
    },
    projects: {
      enabled: false,
      sync_frequency: 'manual'
    }
  }
};