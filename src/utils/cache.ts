import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

interface ProjectInfo {
  hostname: string;
  owner: string;
  repo: string;
  path: string;
  addedAt: string;
}

const CACHE_DIR = path.join(os.homedir(), '.cache', 'vpm');

export async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

function getHostCacheFile(hostname: string): string {
  return path.join(CACHE_DIR, `${hostname}.json`);
}

export async function saveProjectInfo(projectInfo: ProjectInfo) {
  await ensureCacheDir();
  const cacheFile = getHostCacheFile(projectInfo.hostname);

  let projects: ProjectInfo[] = [];
  try {
    const content = await fs.readFile(cacheFile, 'utf-8');
    projects = JSON.parse(content);
  } catch (error) {
    // File doesn't exist or is invalid, start with empty array
  }

  // Check if project already exists
  const existingIndex = projects.findIndex(
    (p) => p.owner === projectInfo.owner && p.repo === projectInfo.repo
  );

  if (existingIndex >= 0) {
    projects[existingIndex] = projectInfo;
  } else {
    projects.push(projectInfo);
  }

  await fs.writeFile(cacheFile, JSON.stringify(projects, null, 2));
}

export async function getProjectInfo(hostname: string, owner: string, repo: string): Promise<ProjectInfo | null> {
  const cacheFile = getHostCacheFile(hostname);

  try {
    const content = await fs.readFile(cacheFile, 'utf-8');
    const projects: ProjectInfo[] = JSON.parse(content);

    return projects.find(
      (p) => p.owner === owner && p.repo === repo
    ) || null;
  } catch (error) {
    return null;
  }
}

export async function getAllProjects(): Promise<ProjectInfo[]> {
  await ensureCacheDir();
  const allProjects: ProjectInfo[] = [];

  try {
    const files = await fs.readdir(CACHE_DIR);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(CACHE_DIR, file), 'utf-8');
        const projects: ProjectInfo[] = JSON.parse(content);
        allProjects.push(...projects);
      }
    }
  } catch (error) {
    // Directory might be empty or not exist yet
  }

  return allProjects;
}