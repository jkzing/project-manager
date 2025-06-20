# @v3b/project-manager

A tool to manage your local projects.

<br>

> 🤖 Code of this project is generated via Cursor.

## Features

- **Add projects**: Clone GitHub repositories to organized local directories
- **Scan directories**: Automatically discover and add existing Git repositories
- **List projects**: View all managed projects in table or tree format
- **Navigate projects**: Quickly jump to project directories using keywords

## Commands

### `vpm add <repo>`

Clone a GitHub repository to a corresponding local directory.

```bash
# Clone using HTTPS URL
vpm add https://github.com/owner/repo

# Clone using SSH URL
vpm add git@github.com:owner/repo.git

# Clone using alias format
vpm add gh:owner/repo
```

### `vpm scan <dir>`

Scan a directory for Git repositories and add them to the project manager.

```bash
# Scan current directory
vpm scan .

# Scan with custom depth
vpm scan /path/to/directory --depth 3

# Dry run to see what would be added
vpm scan . --dry-run
```

### `vpm list`

List all managed projects.

```bash
# List all projects
vpm list

# Filter by hostname
vpm list --host github.com

# Filter by directory
vpm list --dir /path/to/workspace

# Show in tree format
vpm list --format tree
```

### `vpm go <keyword>`

Navigate to a project directory by searching for keywords in project names.

```bash
# Navigate to a specific project
vpm go my-repo

# When multiple projects match, you'll get an interactive selection
vpm go repo
```

**Examples:**
- `vpm go my-repo` - Directly navigates to the `my-repo` project
- `vpm go repo` - If multiple projects contain "repo" in their name, shows an interactive selection menu

The search is case-insensitive and matches against hostname, owner, and repository name.

## Configuration

The project manager uses a TOML configuration file located at `~/.vpm.toml` to customize its behavior. If no configuration file exists, default settings will be used.

### Configuration File Structure

```toml
# Base directory for all projects (default: ~/workspace)
baseDir = "~/workspace"

# Host configurations
[host]
  # GitHub configuration
  [host.github]
    alias = "gh"
    hostname = "github.com"
    baseDir = "github"  # Optional: subdirectory under baseDir
    preferSSH = true    # Optional: prefer SSH over HTTPS

  # GitLab configuration
  [host.gitlab]
    alias = "gl"
    hostname = "gitlab.com"
    baseDir = "gitlab"
    preferSSH = true

  # Custom Git host configuration
  [host.custom]
    alias = "custom"
    hostname = "git.example.com"
    baseDir = "custom"
    preferSSH = false
```

### Configuration Options

#### Global Options

- **`baseDir`** (string): The base directory where all projects will be stored. Defaults to `~/workspace`.

#### Host Configuration

Each host configuration supports the following options:

- **`alias`** (string): Short alias for the host (e.g., `gh` for GitHub). Used in commands like `vpm add gh:owner/repo`.
- **`hostname`** (string): The Git host's domain name (e.g., `github.com`).
- **`baseDir`** (string, optional): Subdirectory under the global `baseDir` for this host's projects. If not specified, uses `{baseDir}/{hostname}`.
- **`preferSSH`** (boolean, optional): Whether to prefer SSH URLs over HTTPS when cloning. Defaults to `true` for GitHub and GitLab.

### Default Configuration

If no configuration file is found, the following defaults are used:

```toml
baseDir = "~/workspace"

[host.github]
alias = "gh"
hostname = "github.com"
preferSSH = true

[host.gitlab]
alias = "gl"
hostname = "gitlab.com"
preferSSH = true
```

### Project Directory Structure

With the default configuration, projects are organized as follows:

```
~/workspace/
├── github.com/
│   ├── owner1/
│   │   ├── repo1/
│   │   └── repo2/
│   └── owner2/
│       └── repo3/
└── gitlab.com/
    └── owner3/
        └── repo4/
```

You can customize this structure by setting different `baseDir` values for each host in your configuration file.

## Installation

```bash
npm install -g @v3b/project-manager
```

## Development

```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run tests
pnpm test

# Format code
pnpm run format

# Check code quality
pnpm run check
```

