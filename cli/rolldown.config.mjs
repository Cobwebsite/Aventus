import { withDefaults } from '../shared.rolldown.config.mjs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const external = ['@aws-sdk/client-s3'];
const resolvePart = {
  alias: {
    '@server': resolve(__dirname, '../server/src')
  }
};
export default withDefaults([
  {
    input: resolve(__dirname, './src/cli.ts'),
    output: {
      file: resolve(__dirname, './out/cli.js'),
      banner: '#!/usr/bin/env node\n',
    },
    resolve: resolvePart,
    external,
  },
  {
    input: resolve(__dirname, './src/interaction/RealInteraction.ts'),
    output: {
      file: resolve(__dirname, './out/RealInteraction.js'),
    },
    resolve: resolvePart,
    external
  },
  {
    input: resolve(__dirname, './src/server/RealServer.ts'),
    output: {
      file: resolve(__dirname, './out/RealServer.js'),
    },
    resolve: resolvePart,
    external
  },
]);