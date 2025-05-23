import { program } from 'commander';
import { add } from './commands/add';

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

  program.parse();
}
