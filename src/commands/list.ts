import path from 'node:path';
import chalk from 'chalk';
import { getConfig } from '../config';
import { getAllProjects } from '../utils/cache';
import { logger } from '../utils/logger';

interface ListOptions {
  host?: string;
  dir?: string;
  format?: 'table' | 'tree';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPath(projectPath: string, baseDir: string): string {
  return path.relative(baseDir, projectPath);
}

function printTable(
  projects: Array<{
    hostname: string;
    owner: string;
    repo: string;
    path: string;
    addedAt: string;
  }>,
  baseDir: string,
) {
  // Calculate column widths
  const hostnameWidth = Math.max(
    'Host'.length,
    ...projects.map((p) => p.hostname.length),
  );
  const ownerWidth = Math.max(
    'Owner'.length,
    ...projects.map((p) => p.owner.length),
  );
  const repoWidth = Math.max(
    'Repository'.length,
    ...projects.map((p) => p.repo.length),
  );
  const pathWidth = Math.max(
    'Path'.length,
    ...projects.map((p) => formatPath(p.path, baseDir).length),
  );
  const dateWidth = Math.max(
    'Added At'.length,
    ...projects.map((p) => formatDate(p.addedAt).length),
  );

  // Print header
  const header = [
    'Host'.padEnd(hostnameWidth),
    'Owner'.padEnd(ownerWidth),
    'Repository'.padEnd(repoWidth),
    'Path'.padEnd(pathWidth),
    'Added At'.padEnd(dateWidth),
  ].join('  ');

  logger.info(header);
  logger.info('─'.repeat(header.length));

  // Print rows
  for (const project of projects) {
    const row = [
      project.hostname.padEnd(hostnameWidth),
      project.owner.padEnd(ownerWidth),
      project.repo.padEnd(repoWidth),
      formatPath(project.path, baseDir).padEnd(pathWidth),
      formatDate(project.addedAt).padEnd(dateWidth),
    ].join('  ');

    logger.info(row);
  }
}

function printTree(
  projects: Array<{
    hostname: string;
    owner: string;
    repo: string;
    path: string;
    addedAt: string;
  }>,
  baseDir: string,
) {
  // Group projects by hostname
  const groupedProjects = projects.reduce(
    (acc, project) => {
      if (!acc[project.hostname]) {
        acc[project.hostname] = [];
      }
      acc[project.hostname].push(project);
      return acc;
    },
    {} as Record<string, typeof projects>,
  );

  // Print tree structure
  for (const [hostname, hostProjects] of Object.entries(groupedProjects)) {
    logger.info(chalk.cyan(hostname));

    // Group by owner
    const ownerGroups = hostProjects.reduce(
      (acc, project) => {
        if (!acc[project.owner]) {
          acc[project.owner] = [];
        }
        acc[project.owner].push(project);
        return acc;
      },
      {} as Record<string, typeof hostProjects>,
    );

    for (const [owner, ownerProjects] of Object.entries(ownerGroups)) {
      logger.info(`  ${chalk.yellow(owner)}`);

      for (const project of ownerProjects) {
        const relativePath = formatPath(project.path, baseDir);
        const date = formatDate(project.addedAt);
        logger.info(`    ${chalk.green(project.repo)}`);
        logger.info(`      ${chalk.gray('Path:')} ${relativePath}`);
        logger.info(`      ${chalk.gray('Added:')} ${date}`);
      }
    }
  }
}

export async function list(options: ListOptions = {}) {
  try {
    const { host, dir, format = 'table' } = options;
    const config = await getConfig();
    const projects = await getAllProjects();

    // Filter projects based on options
    let filteredProjects = projects;
    if (host) {
      filteredProjects = filteredProjects.filter((p) => p.hostname === host);
    }
    if (dir) {
      const targetDir = path.resolve(dir);
      filteredProjects = filteredProjects.filter((p) =>
        p.path.startsWith(targetDir),
      );
    }

    if (filteredProjects.length === 0) {
      logger.warn('No projects found matching the criteria');
      return;
    }

    logger.info(`Found ${filteredProjects.length} projects`);

    if (format === 'table') {
      printTable(filteredProjects, config.baseDir);
    } else {
      printTree(filteredProjects, config.baseDir);
    }
  } catch (error) {
    logger.error((error as Error).message);
    throw error;
  }
}
