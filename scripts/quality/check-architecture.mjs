import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const src = path.join(root, 'src');
const baseline = JSON.parse(await readFile(path.join(root, 'scripts/quality/architecture-baseline.json'), 'utf8'));
const allowedCoreImports = new Set(baseline.coreImportsModules ?? []);
const violations = [];
const debt = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (/\.(?:ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) files.push(full);
  }
  return files;
}

for (const file of await walk(src)) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const text = await readFile(file, 'utf8');

  if (relative.startsWith('src/core/') && /from\s+["'][^"']*modules\//.test(text)) {
    if (allowedCoreImports.has(relative)) debt.push(relative);
    else violations.push(`${relative}: nueva dependencia de src/core hacia src/modules`);
  }

  if (!relative.endsWith('server.ts') && /from\s+["'][^"']*server(?:\.js|\.ts)?["']/.test(text)) {
    violations.push(`${relative}: dependencia no permitida hacia server.ts`);
  }
}

if (violations.length) {
  console.error('Architecture validation failed:\n' + violations.map(v => `- ${v}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Architecture validation OK (${debt.length} dependencias heredadas controladas por baseline)`);
}
