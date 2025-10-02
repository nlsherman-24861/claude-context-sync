import { describe, it, expect, beforeEach, vi } from 'vitest';
import { syncGlobal, syncProject, syncAll, listBackups, restoreBackup } from '../../src/commands/sync.js';

// Mock dependencies
vi.mock('../../src/config/index.js');
vi.mock('../../src/transformers/index.js');
vi.mock('../../src/sync/file-sync.js');
vi.mock('../../src/utils/logger.js');

describe('Sync Commands', () => {
  let mockConfig;
  let mockTransformer;
  let mockFileSync;
  let mockLogger;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock config
    mockConfig = { loadConfig: vi.fn() };
    const configModule = await import('../../src/config/index.js');
    configModule.loadConfig = vi.fn().mockResolvedValue({
      config: {
        professional_background: { experience: '15 years' },
        working_style: { communication: ['Concise'] }
      }
    });

    // Mock transformer
    mockTransformer = {
      transform: vi.fn().mockResolvedValue('# Transformed Content')
    };
    const transformerModule = await import('../../src/transformers/index.js');
    transformerModule.createTransformer = vi.fn().mockReturnValue(mockTransformer);

    // Mock FileSync
    mockFileSync = {
      syncGlobal: vi.fn().mockResolvedValue({ success: true, path: '~/.claude/CLAUDE.md' }),
      syncProject: vi.fn().mockResolvedValue({ success: true, path: '/project/.claude/CLAUDE.md', merged: true }),
      findProjectCLAUDE: vi.fn().mockResolvedValue('/project/.claude/CLAUDE.md'),
      listBackups: vi.fn().mockResolvedValue([]),
      restoreBackup: vi.fn().mockResolvedValue({ success: true, path: '~/.claude/CLAUDE.md', restoredFrom: 'backup.md' }),
      globalCLAUDEPath: '~/.claude/CLAUDE.md'
    };
    const fileSyncModule = await import('../../src/sync/file-sync.js');
    fileSyncModule.FileSync = vi.fn().mockImplementation(() => mockFileSync);

    // Mock logger
    const loggerModule = await import('../../src/utils/logger.js');
    mockLogger = {
      info: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    };
    loggerModule.info = mockLogger.info;
    loggerModule.success = mockLogger.success;
    loggerModule.error = mockLogger.error;
    loggerModule.warn = mockLogger.warn;
  });

  describe('syncGlobal', () => {
    it('should sync preferences to global CLAUDE.md', async () => {
      const result = await syncGlobal();

      expect(result.success).toBe(true);
      expect(mockFileSync.syncGlobal).toHaveBeenCalledWith(
        '# Transformed Content',
        expect.objectContaining({ dryRun: false, backup: true })
      );
      expect(mockLogger.success).toHaveBeenCalledWith(expect.stringContaining('Global CLAUDE.md updated'));
    });

    it('should perform dry run when requested', async () => {
      mockFileSync.syncGlobal.mockResolvedValue({ success: true, dryRun: true, path: '~/.claude/CLAUDE.md' });

      const result = await syncGlobal({ dryRun: true });

      expect(result.dryRun).toBe(true);
      expect(mockFileSync.syncGlobal).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ dryRun: true })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Dry run complete'));
    });

    it('should skip backup when backup option is false', async () => {
      await syncGlobal({ backup: false });

      expect(mockFileSync.syncGlobal).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ backup: false })
      );
    });

    it('should show verbose output when verbose is true', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await syncGlobal({ verbose: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Transformed Content Preview'));

      consoleLogSpy.mockRestore();
    });

    it('should throw error on failure', async () => {
      mockFileSync.syncGlobal.mockRejectedValue(new Error('Write failed'));

      await expect(syncGlobal()).rejects.toThrow('Write failed');
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('failed'));
    });
  });

  describe('syncProject', () => {
    it('should sync preferences to project CLAUDE.md', async () => {
      const result = await syncProject({ path: '/project' });

      expect(result.success).toBe(true);
      expect(mockFileSync.syncProject).toHaveBeenCalledWith(
        '# Transformed Content',
        '/project',
        expect.objectContaining({ dryRun: false, backup: true, noMerge: false })
      );
      expect(mockLogger.success).toHaveBeenCalledWith(expect.stringContaining('Project CLAUDE.md updated'));
    });

    it('should throw error if path is not provided', async () => {
      await expect(syncProject({})).rejects.toThrow('Project path required');
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('required'));
    });

    it('should perform dry run when requested', async () => {
      mockFileSync.syncProject.mockResolvedValue({ success: true, dryRun: true, path: '/project/.claude/CLAUDE.md' });

      const result = await syncProject({ path: '/project', dryRun: true });

      expect(result.dryRun).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Dry run complete'));
    });

    it('should indicate merge when content is merged', async () => {
      mockFileSync.syncProject.mockResolvedValue({ success: true, path: '/project/.claude/CLAUDE.md', merged: true });

      await syncProject({ path: '/project' });

      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Merged with existing'));
    });

    it('should use noMerge option when specified', async () => {
      mockFileSync.syncProject.mockResolvedValue({ success: true, path: '/project/.claude/CLAUDE.md', merged: false });

      await syncProject({ path: '/project', noMerge: true });

      expect(mockFileSync.syncProject).toHaveBeenCalledWith(
        expect.any(String),
        '/project',
        expect.objectContaining({ noMerge: true })
      );
    });

    it('should throw error on failure', async () => {
      mockFileSync.syncProject.mockRejectedValue(new Error('Write failed'));

      await expect(syncProject({ path: '/project' })).rejects.toThrow('Write failed');
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('failed'));
    });
  });

  describe('syncAll', () => {
    it('should sync to global target', async () => {
      const result = await syncAll();

      expect(result.global).toBeDefined();
      expect(result.global.success).toBe(true);
      expect(mockLogger.success).toHaveBeenCalledWith(expect.stringContaining('All targets synced'));
    });

    it('should continue even if global sync fails', async () => {
      mockFileSync.syncGlobal.mockRejectedValue(new Error('Global failed'));

      const result = await syncAll();

      expect(result.errors.length).toBe(1);
      expect(result.errors[0].target).toBe('global');
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('error'));
    });

    it('should pass options to sync operations', async () => {
      await syncAll({ dryRun: true, backup: false });

      expect(mockFileSync.syncGlobal).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ dryRun: true, backup: false })
      );
    });
  });

  describe('listBackups', () => {
    it('should list backups for global target', async () => {
      mockFileSync.listBackups.mockResolvedValue(['backup1.md', 'backup2.md']);

      const result = await listBackups({ target: 'global' });

      expect(result).toEqual(['backup1.md', 'backup2.md']);
      expect(mockLogger.success).toHaveBeenCalledWith(expect.stringContaining('Found 2 backup'));
    });

    it('should list backups for project target', async () => {
      mockFileSync.listBackups.mockResolvedValue(['backup1.md']);

      await listBackups({ target: 'project', path: '/project' });

      expect(mockFileSync.findProjectCLAUDE).toHaveBeenCalledWith('/project');
      expect(mockFileSync.listBackups).toHaveBeenCalled();
    });

    it('should throw error if project path not provided', async () => {
      await expect(listBackups({ target: 'project' })).rejects.toThrow('Project path required');
    });

    it('should throw error for invalid target', async () => {
      await expect(listBackups({ target: 'invalid' })).rejects.toThrow('Invalid target');
    });

    it('should handle no backups gracefully', async () => {
      mockFileSync.listBackups.mockResolvedValue([]);

      await listBackups({ target: 'global' });

      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('No backups found'));
    });
  });

  describe('restoreBackup', () => {
    it('should restore backup for global target', async () => {
      const result = await restoreBackup({ target: 'global', backup: 'backup.md' });

      expect(result.success).toBe(true);
      expect(mockFileSync.restoreBackup).toHaveBeenCalledWith('backup.md', '~/.claude/CLAUDE.md');
      expect(mockLogger.success).toHaveBeenCalledWith(expect.stringContaining('Restored'));
    });

    it('should restore backup for project target', async () => {
      await restoreBackup({ target: 'project', path: '/project', backup: 'backup.md' });

      expect(mockFileSync.findProjectCLAUDE).toHaveBeenCalledWith('/project');
      expect(mockFileSync.restoreBackup).toHaveBeenCalled();
    });

    it('should throw error if backup path not provided', async () => {
      await expect(restoreBackup({ target: 'global' })).rejects.toThrow('Backup path required');
    });

    it('should throw error if project path not provided', async () => {
      await expect(restoreBackup({ target: 'project', backup: 'backup.md' })).rejects.toThrow('Project path required');
    });

    it('should throw error for invalid target', async () => {
      await expect(restoreBackup({ target: 'invalid', backup: 'backup.md' })).rejects.toThrow('Invalid target');
    });

    it('should throw error on restore failure', async () => {
      mockFileSync.restoreBackup.mockRejectedValue(new Error('Restore failed'));

      await expect(restoreBackup({ target: 'global', backup: 'backup.md' })).rejects.toThrow('Restore failed');
    });
  });
});
