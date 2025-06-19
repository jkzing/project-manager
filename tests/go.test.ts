import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllProjects } from '../src/utils/cache';
import { go } from '../src/commands/go';

// Mock dependencies
vi.mock('../src/utils/cache');
vi.mock('../src/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

const mockGetAllProjects = vi.mocked(getAllProjects);

describe('go command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock process.chdir to avoid actually changing directory during tests
    vi.spyOn(process, 'chdir').mockImplementation(() => {});
  });

  it('should show warning when no projects exist', async () => {
    mockGetAllProjects.mockResolvedValue([]);

    await go('test');

    expect(mockGetAllProjects).toHaveBeenCalled();
  });

  it('should show warning when no projects match keyword', async () => {
    const mockProjects = [
      {
        hostname: 'github.com',
        owner: 'user1',
        repo: 'project1',
        path: '/path/to/project1',
        addedAt: '2024-01-01T00:00:00Z',
      },
    ];

    mockGetAllProjects.mockResolvedValue(mockProjects);

    await go('nonexistent');

    expect(mockGetAllProjects).toHaveBeenCalled();
  });

  it('should navigate directly when single project matches', async () => {
    const mockProjects = [
      {
        hostname: 'github.com',
        owner: 'user1',
        repo: 'my-repo',
        path: '/path/to/my-repo',
        addedAt: '2024-01-01T00:00:00Z',
      },
    ];

    mockGetAllProjects.mockResolvedValue(mockProjects);

    await go('my-repo');

    expect(mockGetAllProjects).toHaveBeenCalled();
    expect(process.chdir).toHaveBeenCalledWith('/path/to/my-repo');
  });

  it('should show selection when multiple projects match', async () => {
    const mockProjects = [
      {
        hostname: 'github.com',
        owner: 'user1',
        repo: 'my-repo',
        path: '/path/to/my-repo',
        addedAt: '2024-01-01T00:00:00Z',
      },
      {
        hostname: 'github.com',
        owner: 'user2',
        repo: 'his-repo',
        path: '/path/to/his-repo',
        addedAt: '2024-01-01T00:00:00Z',
      },
    ];

    mockGetAllProjects.mockResolvedValue(mockProjects);

    const { default: inquirer } = await import('inquirer');
    const mockPrompt = vi.mocked(inquirer.prompt);
    mockPrompt.mockResolvedValue({
      selectedProject: mockProjects[0],
    });

    await go('repo');

    expect(mockGetAllProjects).toHaveBeenCalled();
    expect(mockPrompt).toHaveBeenCalled();
    expect(process.chdir).toHaveBeenCalledWith('/path/to/my-repo');
  });

  it('should match projects case-insensitively', async () => {
    const mockProjects = [
      {
        hostname: 'github.com',
        owner: 'user1',
        repo: 'MyRepo',
        path: '/path/to/MyRepo',
        addedAt: '2024-01-01T00:00:00Z',
      },
    ];

    mockGetAllProjects.mockResolvedValue(mockProjects);

    await go('myrepo');

    expect(mockGetAllProjects).toHaveBeenCalled();
    expect(process.chdir).toHaveBeenCalledWith('/path/to/MyRepo');
  });
});