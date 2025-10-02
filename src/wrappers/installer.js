import { join, dirname } from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { fileExists, ensureDir, readText, writeText } from '../utils/fs.js';
import { 
  detectAvailableShells, 
  getInstallationPaths, 
  isInPath, 
  expandTilde,
  getShellProfiles,
  getPowerShellProfile,
  isWindows
} from '../utils/platform.js';
import { info, success, warn, error } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Install wrapper scripts for detected shells
 */
export async function installWrappers(options = {}) {
  const {
    shells = 'auto',
    global = false,
    force = false
  } = options;
  
  const results = {
    installed: [],
    skipped: [],
    errors: []
  };
  
  try {
    // Detect available shells
    const availableShells = shells === 'auto' 
      ? await detectAvailableShells()
      : Array.isArray(shells) ? shells : [shells];
    
    if (availableShells.length === 0) {
      warn('No compatible shells detected');
      return results;
    }
    
    info(`Detected shells: ${availableShells.join(', ')}`);
    
    // Install wrapper for each shell
    for (const shell of availableShells) {
      try {
        const result = await installWrapperForShell(shell, { global, force });
        if (result.success) {
          results.installed.push(result);
        } else {
          results.skipped.push(result);
        }
      } catch (err) {
        results.errors.push({
          shell,
          error: err.message
        });
      }
    }
    
    return results;
  } catch (err) {
    throw new Error(`Failed to install wrappers: ${err.message}`);
  }
}

/**
 * Install wrapper script for a specific shell
 */
async function installWrapperForShell(shell, options = {}) {
  const { global = false, force = false } = options;
  
  // Get template path
  const templatePath = getTemplatePathForShell(shell);
  if (!await fileExists(templatePath)) {
    throw new Error(`Template not found for shell: ${shell}`);
  }
  
  // Get installation paths (ordered by preference)
  const installPaths = getInstallationPaths(shell);
  if (installPaths.length === 0) {
    throw new Error(`No installation paths available for shell: ${shell}`);
  }
  
  // Find the best installation path
  let targetDir = null;
  let targetPath = null;
  
  for (const dir of installPaths) {
    const expandedDir = expandTilde(dir);
    
    // Skip if global flag doesn't match path type
    if (global && !isGlobalPath(expandedDir)) continue;
    if (!global && isGlobalPath(expandedDir)) continue;
    
    // Check if directory exists or can be created
    if (await fileExists(expandedDir) || !isGlobalPath(expandedDir)) {
      targetDir = expandedDir;
      targetPath = join(expandedDir, getWrapperFilename(shell));
      break;
    }
  }
  
  if (!targetDir) {
    throw new Error(`No suitable installation directory found for ${shell}`);
  }
  
  // Check if wrapper already exists
  if (await fileExists(targetPath) && !force) {
    return {
      success: false,
      shell,
      path: targetPath,
      reason: 'already_exists',
      message: `Wrapper already exists at ${targetPath} (use --force to overwrite)`
    };
  }
  
  // Create target directory if needed
  await ensureDir(targetDir);
  
  // Read template and copy to target
  const template = await readText(templatePath);
  await writeText(targetPath, template);
  
  // Make executable on Unix-like systems
  if (!isWindows() && (shell === 'bash' || shell === 'zsh')) {
    await fs.chmod(targetPath, 0o755);
  }
  
  // Check if target directory is in PATH
  const inPath = await isInPath(targetDir);
  
  info(`Installed ${shell} wrapper to: ${targetPath}`);
  
  if (!inPath) {
    warn(`${targetDir} is not in your PATH`);
    await suggestPathAddition(shell, targetDir);
  } else {
    success(`${targetDir} is already in your PATH`);
  }
  
  return {
    success: true,
    shell,
    path: targetPath,
    directory: targetDir,
    inPath,
    message: `Successfully installed ${shell} wrapper`
  };
}

/**
 * Get template file path for a shell
 */
function getTemplatePathForShell(shell) {
  const templateDir = join(__dirname, '..', '..', 'templates', 'wrappers');
  
  const templates = {
    bash: 'sync-claude.sh',
    zsh: 'sync-claude.sh',  // Same as bash
    powershell: 'Sync-Claude.ps1',
    cmd: 'sync-claude.bat'
  };
  
  const filename = templates[shell];
  if (!filename) {
    throw new Error(`No template available for shell: ${shell}`);
  }
  
  return join(templateDir, filename);
}

/**
 * Get wrapper filename for a shell
 */
function getWrapperFilename(shell) {
  const filenames = {
    bash: 'sync-claude',
    zsh: 'sync-claude',
    powershell: 'Sync-Claude.ps1',
    cmd: 'sync-claude.bat'
  };
  
  return filenames[shell] || 'sync-claude';
}

/**
 * Check if a path is a global/system path
 */
function isGlobalPath(path) {
  const globalPaths = [
    '/usr/local/bin',
    '/usr/bin',
    'C:\\Windows\\System32',
    'C:\\Program Files'
  ];
  
  return globalPaths.some(globalPath => 
    path.toLowerCase().startsWith(globalPath.toLowerCase())
  );
}

/**
 * Suggest how to add directory to PATH
 */
async function suggestPathAddition(shell, directory) {
  info(`To add ${directory} to your PATH:`);
  
  if (shell === 'bash' || shell === 'zsh') {
    const profiles = getShellProfiles(shell);
    const existingProfile = profiles.find(p => fileExists(p));
    const profileToUse = existingProfile || profiles[0];
    
    info(`Add this line to ${profileToUse}:`);
    info(`  export PATH="${directory}:$PATH"`);
    info('Then restart your shell or run: source ~/.bashrc');
  } else if (shell === 'powershell') {
    try {
      const profilePath = await getPowerShellProfile();
      info(`Add this line to your PowerShell profile (${profilePath}):`);
      info(`  $env:PATH = "${directory};" + $env:PATH`);
      info('Then restart PowerShell');
    } catch {
      info('Add the directory to your Windows PATH environment variable');
    }
  } else if (shell === 'cmd') {
    info('Add the directory to your Windows PATH environment variable:');
    info('1. Open System Properties > Environment Variables');
    info(`2. Add ${directory} to your PATH variable`);
    info('3. Restart your command prompt');
  }
}

/**
 * Uninstall wrapper scripts
 */
export async function uninstallWrappers(options = {}) {
  const { shells = 'auto' } = options;
  
  const results = {
    removed: [],
    notFound: [],
    errors: []
  };
  
  const shellsToRemove = shells === 'auto' 
    ? ['bash', 'zsh', 'powershell', 'cmd']
    : Array.isArray(shells) ? shells : [shells];
  
  for (const shell of shellsToRemove) {
    try {
      const installPaths = getInstallationPaths(shell);
      const filename = getWrapperFilename(shell);
      
      let found = false;
      for (const dir of installPaths) {
        const wrapperPath = join(expandTilde(dir), filename);
        
        if (await fileExists(wrapperPath)) {
          await fs.unlink(wrapperPath);
          results.removed.push({
            shell,
            path: wrapperPath
          });
          found = true;
          info(`Removed ${shell} wrapper: ${wrapperPath}`);
        }
      }
      
      if (!found) {
        results.notFound.push({ shell });
      }
    } catch (err) {
      results.errors.push({
        shell,
        error: err.message
      });
    }
  }
  
  return results;
}

/**
 * List installed wrappers
 */
export async function listWrappers() {
  const allShells = ['bash', 'zsh', 'powershell', 'cmd'];
  const installed = [];
  
  for (const shell of allShells) {
    const installPaths = getInstallationPaths(shell);
    const filename = getWrapperFilename(shell);
    
    for (const dir of installPaths) {
      const wrapperPath = join(expandTilde(dir), filename);
      
      if (await fileExists(wrapperPath)) {
        const inPath = await isInPath(expandTilde(dir));
        installed.push({
          shell,
          path: wrapperPath,
          directory: expandTilde(dir),
          inPath
        });
      }
    }
  }
  
  return installed;
}