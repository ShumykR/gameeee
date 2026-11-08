import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const SP = process.env.SP ?? 'screenshots';
const out = process.argv[2] ?? 'gal';
const filter = process.argv[3] ?? '';
const port = 5300 + Math.floor(Math.random() * 300);
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((res) => server.stdout.on('data', (d) => { if (String(d).includes('http')) res(); }));
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
p.on('pageerror', (e) => console.log('ERR', e.message));
await p.goto(`http://localhost:${port}/?gallery=1&f=${filter}`);
await p.waitForFunction(() => window.__ready === true, null, { timeout: 90000 });
await p.addStyleTag({ content: '.gallery{position:absolute!important;overflow:visible!important;height:auto!important;bottom:auto!important}' });
await p.waitForTimeout(500);
console.log('cards', (await p.$$('.gcard')).length);
const h = await p.evaluate(() => document.querySelector('.gallery').scrollHeight);
let i = 0;
await p.setViewportSize({ width: 1400, height: 1500 });
for (let y = 0; y < h; y += 1500) {
  await p.evaluate((yy) => { document.querySelector('.gallery').style.transform = `translateY(-${yy}px)`; }, y);
  await p.screenshot({ path: `${SP}/${out}-${i++}.png`, clip: { x: 0, y: 0, width: 1400, height: Math.min(1500, h - y) } });
}
console.log('shots', i);
await b.close();
server.kill();
