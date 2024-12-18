import { describe, it, expect, vi, beforeEach } from 'vitest';
import { add } from '../src/commands/add';
import * as config from '../src/config';
import simpleGit from 'simple-git';
import fs from 'node:fs/promises';
import path from 'node:path';

// Mock 依赖
vi.mock('simple-git');
vi.mock('node:fs/promises');
vi.mock('../src/config', { spy: true });

describe('add command', () => {
  const mockConfig = {
    baseDir: '/home/user/workspace',
    host: {
      github: {
        alias: 'gh',
        hostname: 'github.com',
        preferSSH: true,
      },
      gitlab: {
        alias: 'gl',
        hostname: 'gitlab.com',
        preferSSH: false,
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getConfig
    vi.mocked(config.getConfig).mockResolvedValue(mockConfig);
    // Mock fs.mkdir
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    // Mock simpleGit
    vi.mocked(simpleGit).mockReturnValue({
      clone: vi.fn().mockResolvedValue(undefined),
    } as any);
  });

  it('should handle GitHub HTTPS URL correctly', async () => {
    const url = 'https://github.com/owner/repo';
    await add(url);

    // 验证目录创建
    expect(fs.mkdir).toHaveBeenCalledWith(
      path.join('/home/user/workspace', 'github.com', 'owner', 'repo'),
      { recursive: true },
    );

    // 验证 git clone
    const git = simpleGit();
    expect(git.clone).toHaveBeenCalledWith(
      url,
      path.join('/home/user/workspace', 'github.com', 'owner', 'repo'),
    );
  });

  it('should handle alias format correctly', async () => {
    const url = 'gh:owner/repo';
    await add(url);

    // 验证目录创建
    expect(fs.mkdir).toHaveBeenCalledWith(
      path.join('/home/user/workspace', 'github.com', 'owner', 'repo'),
      { recursive: true },
    );

    // 验证使用 SSH URL 进行克隆
    const git = simpleGit();
    expect(git.clone).toHaveBeenCalledWith(
      'git@github.com:owner/repo.git',
      path.join('/home/user/workspace', 'github.com', 'owner', 'repo'),
    );
  });

  it('should handle SSH URL correctly', async () => {
    const url = 'git@github.com:owner/repo.git';
    await add(url);

    expect(fs.mkdir).toHaveBeenCalledWith(
      path.join('/home/user/workspace', 'github.com', 'owner', 'repo'),
      { recursive: true },
    );

    const git = simpleGit();
    expect(git.clone).toHaveBeenCalledWith(
      url,
      path.join('/home/user/workspace', 'github.com', 'owner', 'repo'),
    );
  });

  it('should throw error for invalid URL', async () => {
    const url = 'invalid-url';

    await expect(add(url)).rejects.toThrow('Invalid repository URL');
  });

  it('should throw error for unknown alias', async () => {
    const url = 'unknown:owner/repo';

    await expect(add(url)).rejects.toThrow('Unknown alias: unknown');
  });
});
