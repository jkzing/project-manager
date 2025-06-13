import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scan } from '../src/commands/scan';
import * as config from '../src/config';
import simpleGit from 'simple-git';
import fs from 'node:fs/promises';
import path from 'node:path';
import { saveProjectInfo } from '../src/utils/cache';
import { Dirent } from 'node:fs';
import { afterEach } from 'node:test';

// Mock dependencies
vi.mock('simple-git');
vi.mock('node:fs/promises');
vi.mock('../src/config', { spy: true });
vi.mock('../src/utils/cache', { spy: true });

describe('scan command', () => {
  const mockConfig = {
    baseDir: '/home/user/workspace',
    host: {
      github: {
        alias: 'gh',
        hostname: 'github.com',
        preferSSH: true,
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getConfig
    vi.mocked(config.getConfig).mockResolvedValue(mockConfig);
    // Mock fs.readdir
    vi.mocked(fs.readdir).mockResolvedValue([]);
    // Mock fs.stat
    vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => true } as any);
    // Mock simpleGit
    vi.mocked(simpleGit).mockReturnValue({
      remote: vi.fn().mockResolvedValue('git@github.com:owner/repo.git'),
    } as any);
    // Mock saveProjectInfo
    vi.mocked(saveProjectInfo).mockResolvedValue(undefined);
  });

  const createMockDirent = (name: string): Dirent => ({
    name,
    isDirectory: () => true,
    isFile: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    parentPath: '/test/dir',
    path: `/test/dir/${name}`,
  });

  it('should scan directory and find git repositories', async () => {
    // Mock directory structure with a git repository
    const mockEntries: Dirent[] = [
      createMockDirent('project1'),
      createMockDirent('node_modules'),
      createMockDirent('.git'),
    ];

    vi.mocked(fs.readdir).mockResolvedValueOnce(mockEntries);
    vi.mocked(fs.stat).mockResolvedValueOnce({ isDirectory: () => true } as any);

    await scan('/test/dir');

    expect(saveProjectInfo).toHaveBeenCalledWith({
      hostname: 'github.com',
      owner: 'owner',
      repo: 'repo',
      path: '/test/dir/project1',
      addedAt: expect.any(String),
    });
  });

  it('should respect max depth option', async () => {
    const mockEntries: Dirent[] = [
      createMockDirent('subdir'),
    ];

    vi.mocked(fs.readdir)
      .mockResolvedValueOnce(mockEntries)
      .mockResolvedValueOnce([]);
      vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => false } as any);

    await scan('/test/dir', { depth: 1 });

    // Should only call readdir once (root + subdir)
    expect(fs.readdir).toHaveBeenCalledTimes(2);
  });

  it('should skip ignored directories', async () => {
    const mockEntries: Dirent[] = [
      createMockDirent('node_modules'),
      createMockDirent('.git'),
      createMockDirent('dist'),
    ];

    vi.mocked(fs.readdir).mockResolvedValueOnce(mockEntries);

    await scan('/test/dir');

    // Should not try to stat ignored directories
    expect(fs.stat).not.toHaveBeenCalledWith(
      expect.stringContaining('node_modules'),
    );
  });

  it('should handle dry run mode', async () => {
    const mockEntries: Dirent[] = [
      createMockDirent('project1'),
      createMockDirent('.git'),
    ];

    vi.mocked(fs.readdir).mockResolvedValueOnce(mockEntries);
    vi.mocked(fs.stat).mockResolvedValueOnce({ isDirectory: () => true } as any);

    await scan('/test/dir', { dryRun: true });

    // Should not save project info in dry run mode
    expect(saveProjectInfo).not.toHaveBeenCalled();
  });

  it('should handle non-git directories gracefully', async () => {
    const mockEntries: Dirent[] = [
      createMockDirent('regular-dir'),
    ];

    vi.mocked(fs.readdir).mockResolvedValueOnce(mockEntries);
    vi.mocked(fs.stat).mockResolvedValueOnce({ isDirectory: () => false } as any);

    await scan('/test/dir');

    // Should not try to get git info for non-git directories
    expect(simpleGit().remote).not.toHaveBeenCalled();
  });

  it('should handle errors during scanning', async () => {
    vi.mocked(fs.readdir).mockRejectedValueOnce(new Error('Permission denied'));

    await expect(scan('/test/dir')).rejects.toThrow('Permission denied');
  });
});