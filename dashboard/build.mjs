// Builds dist/index.html: one self-contained Jinja template for instagram_monitor's web dashboard.
// Tailwind CSS (with the Flowbite plugin) and the Heroicons used are inlined, so the page makes
// no third-party requests. Everything except the {{ version }} meta tag sits inside {% raw %}.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const src = readFileSync('src/index.html', 'utf8');

// Icon names appear as icon('x'), data-icon="x", icon: 'x' or in ternaries; only real Heroicons are kept
const iconFile = name => `node_modules/heroicons/24/outline/${name}.svg`;
const candidates = [...src.matchAll(/(?:icon\(\s*'|data-icon="|icon:\s*'|\? '|: ')([a-z0-9-]+)/g)].map(m => m[1]);
const declared = [...src.matchAll(/(?:icon\(\s*'|data-icon="|icon:\s*')([a-z0-9-]+)/g)].map(m => m[1]);
const missing = declared.filter(n => !existsSync(iconFile(n)));
if (missing.length) { console.error(`build: unknown icons: ${[...new Set(missing)].join(', ')}`); process.exit(1); }
const names = new Set(candidates.filter(n => existsSync(iconFile(n))));
const icons = {};
for (const name of [...names].sort()) {
  const svg = readFileSync(iconFile(name), 'utf8');
  icons[name] = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s*\n\s*/g, '').trim();
}

mkdirSync('build', { recursive: true });
execFileSync('npx', ['tailwindcss', '-c', 'tailwind.config.cjs', '-i', 'src/input.css', '-o', 'build/app.css', '--minify'], { stdio: 'inherit' });
const css = readFileSync('build/app.css', 'utf8');

const out = src
  .replace('/*__TAILWIND__*/', () => css)
  .replace('/*__ICONS__*/{}', () => JSON.stringify(icons));

const fail = msg => { console.error(`build: ${msg}`); process.exit(1); };
if (out.includes('/*__TAILWIND__*/') || out.includes('/*__ICONS__*/')) fail('placeholder not replaced');
if ((out.match(/\{% raw %\}/g) || []).length !== 1 || (out.match(/\{% endraw %\}/g) || []).length !== 1) fail('expected exactly one raw block');
const [before] = out.split('{% raw %}');
const outside = before.replace('{{ version }}', '');
if (/\{\{|\{%|\{#/.test(outside)) fail('Jinja syntax outside the raw block');

mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', out);
console.log(`build: dist/index.html ${(out.length / 1024).toFixed(1)} KiB, ${Object.keys(icons).length} icons`);
