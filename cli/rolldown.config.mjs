import { builtinModules } from 'module';
import { withDefaults } from '../shared.rolldown.config.mjs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const nodeBuiltins = [...builtinModules, ...builtinModules.map(m => `node:${m}`)];
const isExternal = (id) => {
  return id.includes('node_modules') ||
    builtinModules.includes(id) ||
    id.startsWith('node:');
};
const resolvePart = {
  alias: {
    '@server': resolve(__dirname, '../server/src')
  },
  extensions: ['.ts', '.js', '.json', '.cjs'],
  mainFields: ['module', 'main'],
};

const externalPackage = [
  'vscode',
  'bufferutil',
  'utf-8-validate',
  'emitter',

  "@inquirer/core",
  "archiver",
  "chokidar",
  "commander",
  "connect",
  "esbuild",
  "inquirer-file-tree-selection-prompt",
  "open",
  "postcss",
  "sass",
  "send",
  "serve-index",
  "sudo-prompt",
  "terser",
  "typescript",
  "uglify-js",
  "unzipper",
  "vscode",
  "vscode-css-languageservice",
  "vscode-html-languageservice",
  "vscode-json-languageservice",
  "vscode-languageclient",
  "vscode-languageserver",
  "vscode-languageserver-textdocument",
  "ws",
  '@aws-sdk/client-s3',
]

const sharedConfig = {
  resolve: resolvePart,
  external: (id) => {
    // Exclure les builtins de Node (fs, path, etc.)
    if (nodeBuiltins.includes(id)) return true;

    if (id.startsWith('@server')) return false;

    return externalPackage.includes(id);
  },
};

export default withDefaults([
  {
    input: resolve(__dirname, './src/cli.ts'),
    output: {
      file: resolve(__dirname, './out/cli.js'),
      banner: '#!/usr/bin/env node\n',
    },
    ...sharedConfig
  },
  {
    input: resolve(__dirname, './src/interaction/RealInteraction.ts'),
    output: {
      file: resolve(__dirname, './out/RealInteraction.js'),
    },
    ...sharedConfig
  },
  {
    input: resolve(__dirname, './src/server/RealServer.ts'),
    output: {
      file: resolve(__dirname, './out/RealServer.js'),
    },
    ...sharedConfig
  },
]);