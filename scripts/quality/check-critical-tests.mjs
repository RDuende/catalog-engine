import { access, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const required = [
  'src/core/commercial-context',
  'src/modules/ai-gateway',
  'src/modules/sales-brain',
  'src/modules/rai-runtime',
  'src/modules/recommendation-engine',
];
const missing = [];

for (const folder of required) {
  const absolute = path.join(root, folder);
  try {
    await access(absolute);
    const files = await readdir(absolute, { recursive: true });
    if (!files.some(file => file.endsWith('.test.ts'))) missing.push(`${folder}: no contiene tests`);
  } catch {
    missing.push(`${folder}: no existe`);
  }
}

if (missing.length) {
  console.error('Critical test validation failed:\n' + missing.map(v => `- ${v}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log('Critical test validation OK');
}
