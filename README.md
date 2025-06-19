# @v3b/project-manager

Local Project Manager - A tool to manage local projects.

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

