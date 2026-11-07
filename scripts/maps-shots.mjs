// Screenshot every arena (mobile landscape) and compose a contact sheet.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const port = 4800 + Math.floor(Math.random() * 300);
mkdirSync('screenshots', { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((res) => server.stdout.on('data', (d) => String(d).includes('http') && res()));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const ids = (process.argv[2] ?? 'meadow,foundry,sawmill,sky,icecave,neon,desert,moon').split(',');
const steps = Number(process.argv[3] ?? 330);
const files = [];
for (const id of ids) {
  await page.goto(`http://localhost:${port}/?map=${id}&seed=3&bots=1`);
  await page.waitForFunction(() => window.__ready === true);
  await page.keyboard.down('KeyD');
  await page.keyboard.down('ArrowLeft');
  await page.waitForFunction((n) => window.__game.stepCount >= n, steps, { timeout: 120000 });
  const f = `screenshots/map-${id}.png`;
  await page.screenshot({ path: f });
  await page.keyboard.up('KeyD');
  await page.keyboard.up('ArrowLeft');
  files.push(f);
  console.log('shot', id);
}
// contact sheet
const imgs = files.map((f) => 'data:image/png;base64,' + readFileSync(f).toString('base64'));
await page.setViewportSize({ width: 1830, height: 412 * Math.ceil(imgs.length / 2) });
await page.setContent(`<body style="margin:0;display:grid;grid-template-columns:915px 915px;background:#000">${imgs.map((s) => `<img src="${s}" width=915 height=412>`).join('')}</body>`);
await page.waitForTimeout(300);
await page.screenshot({ path: 'screenshots/maps-sheet.png', fullPage: true });
await browser.close();
server.kill();
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('OK');
process.exit(0);
