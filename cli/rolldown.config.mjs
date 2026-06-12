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
  }
};

const sharedConfig = {
  resolve: resolvePart,
  external: (id) => {
    // Exclure les builtins de Node (fs, path, etc.)
    if (nodeBuiltins.includes(id)) return true;

    if (id.startsWith('@server')) return false;
    
    // Si l'import ne commence ni par un point, ni par un slash, 
    // et que ce n'est pas un chemin absolu Windows (ex: C:\), c'est un package NPM !
    const isPackageNpm = /^[^./\\]/.test(id) && !/^[A-Z]:\\/i.test(id);
    
    return isPackageNpm;
  }, // 🌟 On applique le filtre d'exclusion global
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