import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const excluded = new Set(['node_modules', '.git', 'storage', 'dist', 'coverage']);
const findings = [];
const patterns = [
  ['OpenAI API key', /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/g],
  ['Generic private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['Database URL with password', /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/g],
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (excluded.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

for (const file of await walk(root)) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  if (relative === '.env' || relative.startsWith('.env.')) continue;
  if (!/\.(?:ts|tsx|js|mjs|cjs|json|md|yml|yaml|sql|txt|env\.example)$/.test(relative)) continue;
  let text;
  try { text = await readFile(file, 'utf8'); } catch { continue; }
  for (const [label, regex] of patterns) {
    regex.lastIndex = 0;
    if (regex.test(text)) findings.push(`${relative}: ${label}`);
  }
}

if (findings.length) {
  console.error('Potential secrets detected:\n' + findings.map(v => `- ${v}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log('Secret scan OK');
}
