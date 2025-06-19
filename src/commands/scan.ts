import fs from 'node:fs/promises';
import path from 'node:path';
import simpleGit from 'simple-git';
import { getConfig } from '../config';
import { logger } from '../utils/logger';
import { saveProjectInfo } from '../utils/cache';

// Common directories to ignore during scanning
const IGNORED_DIRS = [
  'node_modules',
  '.git',
  '.DS_Store',
  'dist',
  'build',
  '.next',
  '.cache',
  'coverage',
  '.idea',
  '.vscode',
];

interface ScanOptions {
  depth?: number;
  dryRun?: boolean;
}

async function isGitRepo(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(path.join(dirPath, '.git'));
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function getGitRepoInfo(dirPath: string) {
  try {
    const git = simpleGit(dirPath);
    const remote = await git.remote(['get-url', 'origin']);

    if (!remote) {
      return null;
    }

    // Parse remote URL to get hostname, owner, and repo
    const urlPattern = /(?:https?:\/\/|git@)([^/:]+)[/:]([^/]+)\/([^/]+?)(?:\.git)?$/;
    const match = remote.trim().match(urlPattern);

    if (!match) {
      return null;
    }

    const [, hostname, owner, repo] = match;
    return { hostname, owner, repo };
  } catch {
    return null;
  }
}

async function scanDirectory(
  dirPath: string,
  currentDepth: number,
  maxDepth: number,
  options: ScanOptions,
): Promise<void> {
  if (currentDepth > maxDepth) {
    return;
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // Skip ignored directories
      if (entry.isDirectory() && !IGNORED_DIRS.includes(entry.name)) {
        // Check if this is a git repository
        if (await isGitRepo(fullPath)) {
          const repoInfo = await getGitRepoInfo(fullPath);

          if (repoInfo) {
            const { hostname, owner, repo } = repoInfo;

            if (!options.dryRun) {
              await saveProjectInfo({
                hostname,
                owner,
                repo,
                path: fullPath,
                addedAt: new Date().toISOString(),
              });
            }

            logger.info(`Found: ${owner}/${repo}`);
          }
          // If it's already a git repository, don't recursively scan its subdirectories
          continue;
        }

        // Continue scanning subdirectories
        await scanDirectory(fullPath, currentDepth + 1, maxDepth, options);
      }
    }
  } catch (error) {
    throw new Error(`Error scanning directory ${dirPath}: ${(error as Error).message}`, {
      cause: error,
    });
  }
}

export async function scan(targetDir: string, options: ScanOptions = {}) {
  try {
    const { depth = 5, dryRun = false } = options;

    if (dryRun) {
      logger.warn('Dry run mode - no changes will be made');
    }

    await logger.group('Directory Scan', async () => {
      logger.info(`Scanning directory: ${targetDir}`);
      logger.info(`Maximum depth: ${depth}`);

      const config = await getConfig();
      const absolutePath = path.resolve(targetDir);

      let foundRepos = 0;
      await scanDirectory(absolutePath, 0, depth, options);

      if (dryRun) {
        logger.success('Dry run completed successfully!');
      } else {
        logger.success(`Scan completed successfully! Found ${foundRepos} repositories.`);
      }
    });
  } catch (error) {
    logger.error((error as Error).message);
    throw error;
  }
}