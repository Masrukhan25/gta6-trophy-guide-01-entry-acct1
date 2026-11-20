import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const destination = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
// Fail before copying anything, so a missing entrypoint or cover cannot leave a half-built hand-in directory.
if (!existsSync(join(root, 'app', 'index.html'))) throw new Error('The static app is missing app/index.html.');
const screenshotFiles = existsSync(join(root, 'screenshots')) ? readdirSync(join(root, 'screenshots')) : [];
if (!screenshotFiles.some(name => /\.(png|jpe?g|webp)$/i.test(name))) throw new Error('Add at least one rendered screenshot to screenshots/ before packaging.');
mkdirSync(destination, { recursive: true });
cpSync(join(root, 'app'), join(destination, 'app'), { recursive: true });
mkdirSync(join(destination, 'screenshots'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) cpSync(join(root, 'screenshots'), join(destination, 'screenshots'), { recursive: true });
writeFileSync(join(destination, 'dossier.json'), buildDossier(destination, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }));
