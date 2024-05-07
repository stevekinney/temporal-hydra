import select from '@inquirer/select';
import glob from 'fast-glob';
import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { cd, $ } from 'zx';
import chalk from 'chalk';

import { $w } from './worker.js';

const originalWorkingDirectory = process.cwd();

/**
 * @typedef {import('zx').ProcessPromise} WorkerProcess
 * @typedef {{ name: string, scripts: Record<string, string>, path: string }} Sample
 */

/**
 * Filters samples to find those with `npm start` and `npm workflow` scripts.
 * @param {string} directory
 * @returns {Promise<Sample[]>}
 */
export const getSamples = async (directory) => {
  const paths = await glob(`${directory}/**/package.json`, {});

  const packages = await Promise.all(
    paths.map(async (path) => {
      return readFile(path, 'utf-8').then((content) => {
        const { name, scripts } = JSON.parse(content);
        return { name, scripts, path: dirname(path) };
      });
    }),
  );

  return packages.filter(({ scripts }) => {
    if (!scripts) return false;
    if (!scripts.start) return false;
    if (!scripts.workflow) return false;
    return true;
  });
};

/**
 * Selects a sample to run.
 * @param {Sample[]} samples
 */
export const selectSample = async (samples, directory) => {
  return select({
    message: 'Select a sample to run:',
    choices: samples.map((sample) => ({
      name: sample.path.replace(`${directory}/`, ''),
      value: sample,
    })),
    pageSize: 10,
  });
};

/**
 * Runs a sample.
 * @param {Sample} sample
 * @param {WorkerProcess} worker
 */
export const runSample = async (sample) => {
  const { name, path } = sample;

  const sampleName = chalk.magenta(name) + ':';
  const location = join(originalWorkingDirectory, path);

  console.log(chalk.green(`Running sample`, sampleName));

  cd(location);

  console.log(sampleName, chalk.cyan('Installing dependencies…'));

  await $`pnpm install`;

  console.log(sampleName, chalk.blue('Starting worker…'));

  const worker = $w`LOCAL=true pnpm run start`;

  console.log(sampleName, chalk.blue('Starting workflow…'));

  await $`LOCAL=true pnpm run workflow`.quiet();

  console.log(sampleName, chalk.green('Workflow completed!'));

  await worker.kill();

  return console.log(sampleName, chalk.green('Sample completed!'));
};
