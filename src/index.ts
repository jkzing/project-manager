import { program } from 'commander';
import { add } from './commands/add';
import { scan } from './commands/scan';

export function runCli() {
  program
    .name('vpm')
    .description(
      'Git Project Manager - A tool to manage local git repositories',
    );

  program
    .command('add')
    .description('Clone a GitHub repository to a corresponding local directory')
    .argument('<repo>', 'GitHub repository URL')
    .option('--dry-run', 'Show what would be done without actually cloning')
    .action(add);

  program
    .command('scan')
    .description('Scan a directory for Git repositories')
    .argument('<dir>', 'Directory to scan')
    .option('-d, --depth <number>', 'Maximum directory depth to scan', '5')
    .option('--dry-run', 'Show what would be done without actually adding to cache')
    .action(scan);

  program.parse();
}
