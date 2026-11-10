import { build } from 'esbuild';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
await mkdir(`${root}lib`, { recursive: true });
const result = await build({
  absWorkingDir: root,
  entryPoints: ['src/client.js'],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'chrome120',
  loader: { '.css': 'text' },
  write: false,
});
const code = result.outputFiles[0].text;
await writeFile(`${root}lib/client.js`, `// Generated from src/client.js and src/*.css.\nwindow.__ModuleLoader__.load({\n  id: 'dsh-claude-code-refined',\n  factory: (require) => {\n    const module = { exports: {} };\n    const exports = module.exports;\n${code}\n    return module.exports;\n  }\n});\n`);
await copyFile(`${root}src/host.js`, `${root}lib/host.js`);
console.log('Built dsh-claude-code-refined (no bundled runtime dependencies).');
