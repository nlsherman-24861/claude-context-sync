import { join, dirname } from 'path';
import { homedir } from 'os';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

/**
 * Manages file synchronization for CLAUDE.md files
 */
export class FileSync {
  constructor() {
    // Claude Code stores CLAUDE.md in ~/.claude/
    this.globalCLAUDEPath = join(homedir(), '.claude', 'CLAUDE.md');
  }

  /**
   * Sync content to global CLAUDE.md
   */
  async syncGlobal(content, options = {}) {
    const { backup = true, dryRun = false } = options;

    if (dryRun) {
      console.log('DRY RUN - Would write to:', this.globalCLAUDEPath);
      console.log('Content preview:', content.substring(0, 200) + '...');
      return { success: true, dryRun: true, path: this.globalCLAUDEPath };
    }

    // Ensure directory exists
    const dir = dirname(this.globalCLAUDEPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Backup existing file
    if (backup && existsSync(this.globalCLAUDEPath)) {
      await this.createBackup(this.globalCLAUDEPath);
    }

    // Write new content
    writeFileSync(this.globalCLAUDEPath, content, 'utf-8');

    return { success: true, path: this.globalCLAUDEPath };
  }

  /**
   * Sync content to project CLAUDE.md
   */
  async syncProject(content, projectPath, options = {}) {
    const { backup = true, dryRun = false, noMerge = false } = options;

    // Find CLAUDE.md in project
    const projectCLAUDEPath = await this.findProjectCLAUDE(projectPath);

    if (dryRun) {
      console.log('DRY RUN - Would write to:', projectCLAUDEPath);
      console.log('Mode:', noMerge ? 'Overwrite' : 'Merge');
      console.log('Content preview:', content.substring(0, 200) + '...');
      return { success: true, dryRun: true, path: projectCLAUDEPath };
    }

    let finalContent = content;

    // Merge with existing content if requested
    if (!noMerge && existsSync(projectCLAUDEPath)) {
      const existing = readFileSync(projectCLAUDEPath, 'utf-8');
      finalContent = this.mergeContent(existing, content);
    }

    // Backup existing file
    if (backup && existsSync(projectCLAUDEPath)) {
      await this.createBackup(projectCLAUDEPath);
    }

    // Ensure directory exists
    const dir = dirname(projectCLAUDEPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Write merged content
    writeFileSync(projectCLAUDEPath, finalContent, 'utf-8');

    return { success: true, path: projectCLAUDEPath, merged: !noMerge };
  }

  /**
   * Find CLAUDE.md in project directory
   */
  async findProjectCLAUDE(projectPath) {
    // Check .claude/CLAUDE.md first (new standard location)
    const claudePath = join(projectPath, '.claude', 'CLAUDE.md');
    if (existsSync(claudePath)) {
      return claudePath;
    }

    // Check root CLAUDE.md (legacy)
    const rootPath = join(projectPath, 'CLAUDE.md');
    if (existsSync(rootPath)) {
      return rootPath;
    }

    // Default to .claude/CLAUDE.md for new files
    return claudePath;
  }

  /**
   * Merge new user preferences with existing project content
   */
  mergeContent(existing, newUserPreferences) {
    // Look for project context marker
    const projectMarker = '# PROJECT CONTEXT';

    if (existing.includes(projectMarker)) {
      // Find where project context starts
      const markerIndex = existing.indexOf(projectMarker);
      const projectContext = existing.substring(markerIndex);

      // Replace user preferences, keep project context
      return newUserPreferences.trim() + '\n\n---\n\n' + projectContext;
    } else {
      // No clear separation - prepend user preferences
      return newUserPreferences.trim() + '\n\n---\n\n' + existing;
    }
  }

  /**
   * Create timestamped backup of file
   */
  async createBackup(filePath) {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/:/g, '-')
      .replace(/\..+$/, '')
      .replace('T', '-') + '-' + now.getMilliseconds().toString().padStart(3, '0');

    const backupPath = `${filePath}.backup.${timestamp}`;
    const content = readFileSync(filePath, 'utf-8');
    writeFileSync(backupPath, content, 'utf-8');

    return backupPath;
  }

  /**
   * List available backups for a file
   */
  async listBackups(filePath) {
    const dir = dirname(filePath);
    const filename = filePath.split(/[/\\]/).pop();

    if (!existsSync(dir)) {
      return [];
    }

    const { readdirSync } = await import('fs');
    const files = readdirSync(dir);

    return files
      .filter(f => f.startsWith(`${filename}.backup.`))
      .map(f => join(dir, f))
      .sort()
      .reverse(); // Most recent first
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupPath, targetPath) {
    if (!existsSync(backupPath)) {
      throw new Error(`Backup not found: ${backupPath}`);
    }

    const content = readFileSync(backupPath, 'utf-8');

    // Backup current file before restoring
    if (existsSync(targetPath)) {
      await this.createBackup(targetPath);
    }

    writeFileSync(targetPath, content, 'utf-8');

    return { success: true, path: targetPath, restoredFrom: backupPath };
  }
}
