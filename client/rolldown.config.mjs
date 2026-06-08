import { withDefaults } from '../shared.rolldown.config.mjs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default withDefaults({
  input: resolve(__dirname, './src/index.ts'),
  output: {
    file: resolve(__dirname, './out/index.js'),
  }
});