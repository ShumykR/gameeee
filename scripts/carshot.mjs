// In-game screenshots of given cars mid-drive (to see moving pieces at work), tiled into one sheet.
//   node scripts/carshot.mjs id,id,… [steps] [map]     (needs a build: npx vite build)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
const port = 4800 + Math.floor(Math.random() * 300);
mkdirSync('screenshots', { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((res) => server.stdout.on('data', (d) => String(d).includes('http') && res()));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 760, height: 340 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();
const ids = process.argv[2].split(',');
const steps = Number(process.argv[3] ?? 250);
const map = process.argv[4] ?? 'bunker';
const files = [];
for (const id of ids) {
  await page.goto(`http://localhost:${port}/?map=${map}&seed=3&p1=${id}&p2=${id}&randomcars=0`);
  await page.waitForFunction(() => window.__ready === true);
  await page.keyboard.down('KeyD');
  await page.keyboard.down('ArrowLeft');
  await page.waitForFunction((n) => window.__game.stepCount >= n, steps, { timeout: 120000 });
  const f = `screenshots/car-${id}.png`;
  await page.screenshot({ path: f, clip: { x: 20, y: 225, width: 360, height: 110 } });
  await page.keyboard.up('KeyD');
  await page.keyboard.up('ArrowLeft');
  files.push(f);
}
const imgs = files.map((f) => 'data:image/png;base64,' + readFileSync(f).toString('base64'));
const sh = await browser.newPage({ viewport: { width: 1440, height: 220 * Math.ceil(imgs.length / 2) }, deviceScaleFactor: 1 });
await sh.setContent(`<body style="margin:0;display:grid;grid-template-columns:720px 720px;background:#000">${imgs.map((s) => `<img src="${s}" width=720 height=220>`).join('')}</body>`);
await sh.waitForTimeout(300);
await sh.screenshot({ path: 'screenshots/cars-sheet.png', fullPage: true });
await browser.close();
server.kill();
console.log('OK');
