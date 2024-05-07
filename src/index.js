import { writeFile } from 'fs/promises';

import chalk from 'chalk';
import { Command } from 'commander';
import { which } from 'zx';

import {
  clean,
  clone,
  getSamples,
  selectSample,
  runSample,
} from './lib/index.js';

const program = new Command();
program.name('temporal-hydra');

const temporal = await which('temporal');
const repository = 'temporalio/samples-typescript';
const directory = './samples';

if (!temporal) {
  console.error(
    chalk.red(
      `Temporal CLI not found. Please install it by running ${chalk.magenta(
        'brew install temporal',
      )}.`,
    ),
  );
  process.exit(1);
}

const samples = await getSamples(directory);

program
  .command('fetch')
  .description('Fetches the samples repository')
  .action(async () => {
    await clean(directory);
    await clone(repository, directory);
  });

program
  .command('all')
  .description('Runs all of the samples')
  .option('-v, --verbose', 'Prints verbose output to the terminal')
  .option('-o, --output', 'Output directory')
  .action(async (options) => {
    /**
     * @type {string[]}
     */
    const success = [];

    /**
     * @type {(Sample & { error: string })[]}
     */
    const failure = [];

    for (const sample of samples) {
      try {
        await runSample(sample);
        success.push(sample.name);
      } catch (error) {
        if (options.verbose) {
          console.error(chalk.red('Failed to run sample:'), sample.name, error);
        }

        failure.push({ ...sample, error: error.message });
      }
    }

    console.log(chalk.green('Successes:'), success.join(', '));
    console.log(
      chalk.red('Failures:'),
      failure.map(({ name }) => name).join(', '),
    );

    if (options.output && failure.length > 0) {
      console.log(chalk.red('Failures written to:', 'failures.json'));
      await writeFile('failures.json', JSON.stringify(failure, null, 2));
    }

    process.exit(0);
  });

program
  .command('select')
  .description('Selects a sample to run')
  .action(async () => {
    const sample = await selectSample(samples, directory);
    await runSample(sample);
    process.exit(0);
  });

program.parse();
