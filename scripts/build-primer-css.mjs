import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const sourcePath = resolve(repoRoot, 'node_modules', '@primer', 'css', 'dist', 'primer.css');
const outputDir = resolve(repoRoot, 'assets', 'css');
const outputPath = resolve(outputDir, 'primer.css');

mkdirSync(outputDir, { recursive: true });
copyFileSync(sourcePath, outputPath);
console.log(`Primer CSS copied to ${outputPath}`);
