import chalk from 'chalk';
import { $ } from 'zx';

/**
 * @typedef {import('zx').ProcessPromise} WorkerProcess
 */

/**
 * A worker that runs a process and handles signals.
 * @class Worker
 * @property {WorkerProcess} process
 * @method kill
 **/
export class Worker {
  process;
  verbose = false;

  /**
   * @type {Worker[]}
   */
  static #workers = [];
  static get workers() {
    return Worker.#workers;
  }

  /**
   * Kills all workers.
   * @param {number} code
   */
  static killAll(code = 0) {
    return async () => {
      await Promise.all(Worker.#workers.map((worker) => worker.kill()));
      process.exit(code);
    };
  }

  /**
   * @param {WorkerProcess} childProcess
   */
  constructor(childProcess, verbose = false) {
    this.process = childProcess;
    this.verbose = verbose;

    this.process.catch(() => this.kill());

    Worker.#workers.push(this.process);
  }

  async kill() {
    if (!this.process) return;

    await this.process?.kill();

    this.process = undefined;

    Worker.#workers = Worker.#workers.filter(
      (worker) => worker !== this.process,
    );

    if (this.verbose) console.log(chalk.yellow('Worker killed.'));
  }
}

process.on('SIGINT', Worker.killAll(1));
process.on('beforeExit', Worker.killAll(0));

/**
 * Creates a new worker.
 * @param {[string]} command
 * @returns Worker
 */
export const $w = (command) => {
  return new Worker($`${command[0]}`.quiet());
};
