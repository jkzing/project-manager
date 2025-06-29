import path from 'node:path';
import chalk from 'chalk';
import clipboardy from 'clipboardy';
import inquirer from 'inquirer';
import { getAllProjects } from '../utils/cache';
import { logger } from '../utils/logger';

function matchProject(
  project: { hostname: string; owner: string; repo: string; path: string },
  keyword: string,
): boolean {
  const searchText =
    `${project.hostname} ${project.owner} ${project.repo}`.toLowerCase();
  return searchText.includes(keyword.toLowerCase());
}

function formatProjectChoice(project: {
  hostname: string;
  owner: string;
  repo: string;
  path: string;
}): string {
  return `${chalk.cyan(project.hostname)}/${chalk.yellow(project.owner)}/${chalk.green(project.repo)}`;
}

async function outputCdCommand(projectPath: string) {
  const cdCommand = `cd "${projectPath}"`;

  // Output cd command for shell to execute
  process.stdout.write(`${cdCommand}\n`);

  try {
    // Copy to clipboard
    await clipboardy.write(cdCommand);
    logger.success('Command copied to clipboard!');
  } catch (error) {
    logger.warn('Failed to copy command to clipboard');
  }
}

export async function go(keyword: string) {
  try {
    const projects = await getAllProjects();

    if (projects.length === 0) {
      logger.warn(
        'No projects found. Please add some projects first using "vpm add" or "vpm scan"',
      );
      return;
    }

    // Filter projects that match the keyword
    const matchedProjects = projects.filter((project) =>
      matchProject(project, keyword),
    );

    if (matchedProjects.length === 0) {
      logger.warn(`No projects found matching "${keyword}"`);
      logger.info('Available projects:');
      for (const project of projects) {
        logger.info(`  ${formatProjectChoice(project)}`);
      }
      process.exit(1);
    }

    if (matchedProjects.length === 1) {
      // Single match, directly navigate
      const project = matchedProjects[0];
      logger.info(`Navigating to ${formatProjectChoice(project)}`);
      logger.info(`Path: ${project.path}`);

      await outputCdCommand(project.path);
    } else {
      // Multiple matches, show selection
      logger.info(
        `Found ${matchedProjects.length} projects matching "${keyword}":`,
      );

      const choices = matchedProjects.map((project) => ({
        name: `${formatProjectChoice(project)} (${project.path})`,
        value: project,
      }));

      const { selectedProject } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedProject',
          message: 'Select a project to navigate to:',
          choices,
        },
      ]);

      logger.info(`Navigating to ${formatProjectChoice(selectedProject)}`);
      logger.info(`Path: ${selectedProject.path}`);

      await outputCdCommand(selectedProject.path);
    }
  } catch (error) {
    logger.error((error as Error).message);
    throw error;
  }
}
