// Smoke test: builds must exist (npm run build). Starts `vite preview`, opens the
// game on a desktop viewport and a Pixel-8-Pro-like landscape viewport, plays a
// few seconds, saves screenshots and fails on console errors.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const query = args.query ?? '';
const tag = args.tag ?? 'smoke';
const waitMs = Number(args.wait ?? 6000);
const scale = Number(args.scale ?? 2);
const port = 4173 + Math.floor(Math.random() * 500);
mkdirSync('screenshots', { recursive: true });

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error('preview did not start')), 20000);
  server.stdout.on('data', (d) => { if (String(d).includes('http')) { clearTimeout(t); res(); } });
});

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];
const viewports = [
  { name: 'mobile', viewport: { width: 915, height: 412 }, isMobile: true, hasTouch: true, deviceScaleFactor: scale },
  { name: 'desktop', viewport: { width: 1280, height: 720 }, deviceScaleFactor: scale === 2 ? 1.5 : 1 },
];
try {
  for (const vp of viewports) {
    const ctx = await browser.newContext(vp);
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${vp.name}] ${m.text()}`); });
    page.on('pageerror', (e) => errors.push(`[${vp.name}] pageerror: ${e.message}`));
    await page.goto(`http://localhost:${port}/?${query}`);
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 20000 });
    if (args.click) {
      for (const sel of args.click.split(',')) {
        await page.click(sel, { timeout: 5000 }).catch((e) => errors.push(`[${vp.name}] click ${sel}: ${e.message}`));
        await page.waitForTimeout(400);
      }
    }
    if (args.menushot) await page.screenshot({ path: `screenshots/${tag}-${vp.name}-menu.png` });
    if (args.keys) {
      // hold keys for a while: "KeyD,ArrowLeft"
      for (const k of args.keys.split(',')) await page.keyboard.down(k);
    }
    if (args.steps) await page.waitForFunction((n) => window.__game.stepCount >= n, Number(args.steps), { timeout: 90000 });
    else await page.waitForTimeout(waitMs);
    await page.screenshot({ path: `screenshots/${tag}-${vp.name}.png` });
    if (args.keys) for (const k of args.keys.split(',')) await page.keyboard.up(k);
    const state = await page.evaluate(() => {
      const g = window.__game;
      if (!g) return null;
      return { phase: g.phase, scores: g.match.scores, round: g.match.round, cars: g.cars.map((c) => ({ x: +c.position.x.toFixed(2), y: +c.position.y.toFixed(2), a: +c.angle.toFixed(2), alive: c.alive })) };
    });
    console.log(vp.name, JSON.stringify(state));
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
if (errors.length) {
  console.error('Console errors:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('OK, no console errors');
process.exit(0);
