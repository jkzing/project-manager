import TOML from '@iarna/toml';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

export interface HostConfig {
  alias: string;
  hostname: string;
  baseDir?: string;
  preferSSH?: boolean;
}

export interface Config {
  baseDir: string;
  host: Record<string, HostConfig>;
}

const DEFAULT_CONFIG: Config = {
  baseDir: path.join(os.homedir(), 'workspace'),
  host: {
    github: {
      alias: 'gh',
      hostname: 'github.com',
      preferSSH: true,
    },
    gitlab: {
      alias: 'gl',
      hostname: 'gitlab.com',
      preferSSH: true,
    },
  },
};

function resolveBaseDir(baseDir: string, rootBaseDir: string): string {
  if (path.isAbsolute(baseDir)) {
    return baseDir;
  }
  return path.join(rootBaseDir, baseDir);
}

export async function getConfig(): Promise<Config> {
  try {
    const configPath = path.join(os.homedir(), '.lgrm.toml');
    const content = await fs.readFile(configPath, 'utf-8');
    const rawConfig = TOML.parse(content) as Partial<Config>;

    const config: Config = {
      ...DEFAULT_CONFIG,
      ...rawConfig,
      host: {
        ...DEFAULT_CONFIG.host,
        ...(rawConfig.host || {}),
      },
    };

    const rootBaseDir = config.baseDir;
    for (const hostConfig of Object.values(config.host)) {
      if (hostConfig.baseDir) {
        hostConfig.baseDir = resolveBaseDir(hostConfig.baseDir, rootBaseDir);
      }
    }

    return config;
  } catch (error) {
    return DEFAULT_CONFIG;
  }
}

export function findHostByAlias(
  config: Config,
  alias: string,
): HostConfig | undefined {
  return Object.values(config.host).find((host) => host.alias === alias);
}

export function findHostByHostname(
  config: Config,
  hostname: string,
): HostConfig | undefined {
  return Object.values(config.host).find((host) => host.hostname === hostname);
}
