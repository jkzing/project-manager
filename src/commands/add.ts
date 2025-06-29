import fs from 'node:fs/promises';
import path from 'node:path';
import simpleGit, { type SimpleGitProgressEvent } from 'simple-git';
import {
  type Config,
  type HostConfig,
  findHostByAlias,
  findHostByHostname,
  getConfig,
} from '../config';
import { saveProjectInfo } from '../utils/cache';
import { logger } from '../utils/logger';

interface ParsedRepo {
  hostname: string;
  owner: string;
  repo: string;
  isAlias: boolean;
  hostConfig: HostConfig | undefined;
}

function parseRepoUrl(url: string, config: Config): ParsedRepo {
  // First try to parse alias format alias:owner/repo
  const aliasPattern = /^([^:@]+):([^/]+)\/([^/]+)$/;
  const aliasMatch = url.match(aliasPattern);

  if (aliasMatch) {
    const [, alias, owner, repo] = aliasMatch;
    const hostConfig = findHostByAlias(config, alias);
    if (!hostConfig) {
      throw new Error(`Unknown alias: ${alias}`);
    }
    return {
      hostname: hostConfig.hostname,
      owner,
      repo,
      hostConfig,
      isAlias: true,
    };
  }

  // Then try to parse standard git URL
  const urlPattern =
    /(?:https?:\/\/|git@)([^/:]+)[/:]([^/]+)\/([^/]+?)(?:\.git)?$/;
  const urlMatch = url.match(urlPattern);

  if (!urlMatch) {
    throw new Error('Invalid repository URL');
  }

  const [, hostname, owner, repo] = urlMatch;
  const hostConfig = findHostByHostname(config, hostname);

  return { hostname, owner, repo, hostConfig, isAlias: false };
}

function constructGitUrl(
  hostname: string,
  owner: string,
  repo: string,
  useSSH: boolean,
): string {
  if (useSSH) {
    return `git@${hostname}:${owner}/${repo}.git`;
  }
  return `https://${hostname}/${owner}/${repo}.git`;
}

function getTargetDir(
  config: Config,
  hostname: string,
  owner: string,
  repo: string,
  hostConfig?: HostConfig,
): string {
  // Use host-specific baseDir, if not available use global baseDir
  const baseDir = hostConfig?.baseDir || path.join(config.baseDir, hostname);
  return path.join(baseDir, owner, repo);
}

interface AddOptions {
  dryRun?: boolean;
}

export async function add(repoUrl: string, options: AddOptions = {}) {
  try {
    const { dryRun = false } = options;

    if (dryRun) {
      logger.warn('Dry run mode - no changes will be made');
    }

    logger.info(`Initializing repository clone from ${repoUrl}`);
    const config = await getConfig();

    logger.step(1, 4, 'Parsing repository URL...');
    const { hostname, owner, repo, hostConfig, isAlias } = parseRepoUrl(
      repoUrl,
      config,
    );

    const targetDir = getTargetDir(config, hostname, owner, repo, hostConfig);
    logger.step(2, 4, `Creating directory: ${targetDir}`);

    if (!dryRun) {
      await fs.mkdir(targetDir, { recursive: true });
    }

    const shouldUseSSH = hostConfig?.preferSSH ?? false;
    const gitUrl = isAlias
      ? constructGitUrl(hostname, owner, repo, shouldUseSSH)
      : repoUrl;

    logger.step(3, 4, 'Cloning repository...');

    if (!dryRun) {
      const git = simpleGit({
        progress: ({ method, stage, progress }: SimpleGitProgressEvent) => {
          // This function needs to stay here, otherwise outputHandler will not be called when cloning
        },
      }).outputHandler((_command, stdout, stderr, _args) => {
        stdout.pipe(process.stdout);
        stderr.pipe(process.stderr);
      });

      await git.clone(gitUrl, targetDir);

      // Save project information to cache
      logger.step(4, 4, 'Saving project information...');
      await saveProjectInfo({
        hostname,
        owner,
        repo,
        path: targetDir,
        addedAt: new Date().toISOString(),
      });

      logger.success('Repository cloned successfully!');
    } else {
      logger.info(`Would clone ${gitUrl} to ${targetDir}`);
      logger.success('Dry run completed successfully!');
    }

    logger.info(`Location: ${targetDir}`);
  } catch (error) {
    logger.error((error as Error).message);
    throw error;
  }
}
