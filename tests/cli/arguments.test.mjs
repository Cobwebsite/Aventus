import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const { Command } = require('commander');
const result = await build({ entryPoints: ['cli/src/commands/Action.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);
const { Action, ActionGroup } = module.exports;

function command() {
  Action.actions = {};
  const received = [];
  class Example extends Action {
    get name() { return 'example'; }
    get description() { return 'Example action'; }
    registerArgs(add) { add({ type: 'config', typeIsRequired: true, description: 'Config path' }); }
    registerOptions(add) {
      add({ name: 'builds', type: 'name', typeIsArray: true, description: 'Build names' });
      add({ name: 'json', description: 'JSON output' });
    }
    async run(args, options) { received.push({ args, options }); }
  }
  const program = new Command();
  program.exitOverride();
  program.configureOutput({ writeErr() {}, writeOut() {} });
  new Example().register(program);
  return { program, received };
}

test('registered action exposes required argument, variadic option and help', () => {
  const { program } = command();
  const help = program.helpInformation();
  assert.match(help, /example/);
  const actionHelp = program.commands[0].helpInformation();
  assert.match(actionHelp, /<config>/);
  assert.match(actionHelp, /--builds <name\.\.\.>/);
  assert.match(actionHelp, /--json/);
});

test('argument parser rejects missing input and unknown option before running', async () => {
  const { program, received } = command();
  await assert.rejects(program.parseAsync(['example'], { from: 'user' }), error => error.code === 'commander.missingArgument');
  await assert.rejects(program.parseAsync(['example', 'config.avt', '--unknown'], { from: 'user' }), error => error.code === 'commander.unknownOption');
  assert.deepEqual(received, []);
});

test('argument parser forwards options and positional argument to action', async () => {
  const { program, received } = command();
  const originalExit = process.exit;
  const done = new Error('action completed');
  process.exit = code => { assert.equal(code, 0); throw done; };
  try {
    await assert.rejects(program.parseAsync(['example', 'config.avt', '--builds', 'web', 'api', '--json'], { from: 'user' }), error => error === done);
  } finally {
    process.exit = originalExit;
  }
  assert.equal(received.length, 1);
  assert.deepEqual(received[0].args, ['config.avt']);
  assert.deepEqual(received[0].options.builds, ['web', 'api']);
  assert.equal(received[0].options.json, true);
});

test('nested action shares its group and requires its named option', async () => {
  Action.actions = {};
  const received = [];
  class ProjectGroup extends ActionGroup {
    get name() { return 'project'; }
    get description() { return 'Project commands'; }
  }
  class ProjectCreate extends Action {
    get name() { return 'project create'; }
    get description() { return 'Create a project'; }
    registerArgs(add) { add({ type: 'folder', typeIsRequired: true, description: 'Target folder' }); }
    registerOptions(add) { add({ name: 'template', shortName: 't', type: 'name', required: true, description: 'Template' }); }
    async run(args, options) { received.push({ args, template: options.template }); }
  }
  const program = new Command();
  program.exitOverride();
  program.configureOutput({ writeErr() {}, writeOut() {} });
  new ProjectGroup().register(program);
  new ProjectCreate().register(program);
  assert.equal(program.commands.filter(command => command.name() === 'project').length, 1);
  await assert.rejects(program.parseAsync(['project', 'create', 'target'], { from: 'user' }), error => error.code === 'commander.missingMandatoryOptionValue');
  assert.deepEqual(received, []);
  const originalExit = process.exit;
  const done = new Error('action completed');
  process.exit = code => { assert.equal(code, 0); throw done; };
  try {
    await assert.rejects(program.parseAsync(['project', 'create', 'target', '-t', 'Empty'], { from: 'user' }), error => error === done);
  } finally {
    process.exit = originalExit;
  }
  assert.deepEqual(received, [{ args: ['target'], template: 'Empty' }]);
});

test('registered parser accepts repeated selections and contradictory build flags', async () => {
  Action.actions = {};
  const received = [];
  class BuildLike extends Action {
    get name() { return 'build'; }
    get description() { return 'Build'; }
    registerArgs() {}
    registerOptions(add) {
      add({ name: 'builds', type: 'name', typeIsArray: true, description: 'Selected builds' });
      add({ name: 'no-builds', description: 'Disable builds' });
      add({ name: 'verbose', description: 'Verbose' });
      add({ name: 'silent', description: 'Silent' });
    }
    run(args, options) { received.push({ args, options }); }
  }
  const program = new Command();
  program.exitOverride();
  program.configureOutput({ writeErr() {}, writeOut() {} });
  new BuildLike().register(program);
  const originalExit = process.exit;
  const done = new Error('action completed');
  process.exit = code => { assert.equal(code, 0); throw done; };
  try {
    await assert.rejects(program.parseAsync(['build', '--builds', 'web', '--builds', 'api'], { from: 'user' }), error => error === done);
    await assert.rejects(program.parseAsync(['build', '--builds', 'web', '--builds', 'api', '--no-builds', '--verbose', '--silent'], { from: 'user' }), error => error === done);
  } finally {
    process.exit = originalExit;
  }
  assert.equal(received.length, 2);
  assert.deepEqual(received[0].args, []);
  assert.deepEqual(received[0].options.builds, ['web', 'api']);
  assert.equal(received[1].options.builds, false);
  assert.equal(received[1].options.verbose, true);
  assert.equal(received[1].options.silent, true);
});

test('synchronous parse returns before an asynchronous action finishes', async () => {
  Action.actions = {};
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  let started = false;
  let finished = false;
  class Delayed extends Action {
    get name() { return 'delayed'; }
    get description() { return 'Delayed action'; }
    registerArgs() {}
    registerOptions() {}
    async run() { started = true; await pending; finished = true; }
  }
  const program = new Command();
  new Delayed().register(program);
  const originalExit = process.exit;
  const exits = [];
  process.exit = code => exits.push(code);
  try {
    const returned = program.parse(['delayed'], { from: 'user' });
    assert.equal(returned, program);
    assert.equal(started, true);
    assert.equal(finished, false);
    assert.deepEqual(exits, []);
    release();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(finished, true);
    assert.deepEqual(exits, [0]);
  } finally {
    process.exit = originalExit;
    release();
  }
});
