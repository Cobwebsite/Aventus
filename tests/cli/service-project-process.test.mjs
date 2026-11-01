import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const cli = resolve('cli/out/cli.js');
const interaction = resolve('cli/out/RealInteraction.js');

test('packaged service commands route prompts and install local assets in temporary storage', () => {
  const directory = mkdtempSync(join(tmpdir(), 'aventus-cli-services-'));
  const preload = join(directory, 'preload.cjs');
  const promptLog = join(directory, 'prompts.jsonl');
  const run = (...args) => {
    const result = spawnSync(process.execPath, ['--require', preload, cli, ...args], {
      cwd: directory, env: { ...process.env, APPDATA: directory, AVENTUS_PROMPT_LOG: promptLog },
      encoding: 'utf8', timeout: 15000, maxBuffer: 4 * 1024 * 1024,
    });
    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 0, result.stderr + result.stdout);
    return result;
  };
  try {
    writeFileSync(preload, `
      const fs = require('fs');
      const { RealInteraction } = require(${JSON.stringify(interaction)});
      const record = (kind, question, choices) => fs.appendFileSync(process.env.AVENTUS_PROMPT_LOG, JSON.stringify({kind, question, choices}) + '\\n');
      RealInteraction.select = async (question, choices) => {
        record('select', question, choices);
        return choices.find(choice => choice.name === 'No' || choice.name === 'Local')?.value ?? null;
      };
      RealInteraction.selectMultiple = async (question, choices) => {
        record('multiple', question, choices);
        return choices.length ? [choices[0].value] : null;
      };
      RealInteraction.input = async question => { record('input', question); return null; };
      RealInteraction.password = async question => { record('password', question); return null; };
    `);
    run('project', 'install');
    run('template', 'install');
    run('store', 'login');
    run('dependencies', 'help-llm');
    const prompts = readFileSync(promptLog, 'utf8').trim().split(/\r?\n/).map(JSON.parse);
    assert.ok(prompts.some(item => item.kind === 'multiple' && /projects to import/i.test(item.question)));
    assert.ok(prompts.some(item => item.kind === 'multiple' && /templates to import/i.test(item.question)));
    assert.ok(prompts.some(item => item.kind === 'input' && /username/i.test(item.question)));
    const storage = join(directory, 'aventus');
    for (const kind of ['projects', 'templates']) {
      const installed = readdirSync(join(storage, kind), { recursive: true });
      assert.ok(installed.some(name => name.endsWith('template.avt.ts')), kind);
    }
    assert.equal(existsSync(join(directory, '.aventus', 'dependencies')), true);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
  assert.equal(existsSync(directory), false);
});
