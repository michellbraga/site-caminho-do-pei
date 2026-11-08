import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.QA_URL || 'http://127.0.0.1:4173';
const widths = [360, 390, 430, 768, 1024, 1280, 1440, 1920];
const outDir = path.resolve('qa/depois');
await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [];

async function run(width, reducedMotion = 'no-preference') {
  const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion });
  const page = await context.newPage();
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (let y = 0; y < document.documentElement.scrollHeight; y += 220) {
      window.scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 45));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
  const result = await page.evaluate(() => {
    const width = window.innerWidth;
    const overflow = document.documentElement.scrollWidth > width;
    const out = [...document.querySelectorAll('body *')].flatMap(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return [];
      let p = el.parentElement, clipped = false;
      while (p && p !== document.body) {
        const s = getComputedStyle(p);
        if (/(hidden|clip|auto|scroll)/.test(s.overflowX) && (r.left < p.getBoundingClientRect().left - 1 || r.right > p.getBoundingClientRect().right + 1)) { clipped = true; break; }
        p = p.parentElement;
      }
      if (clipped) return [];
      if (r.right > width + 1 || r.left < -1) {
        const selector = el.id ? '#' + el.id : el.classList.length ? el.tagName.toLowerCase() + '.' + [...el.classList].join('.') : el.tagName.toLowerCase();
        return [{ selector, left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) }];
      }
      return [];
    });
    return { overflow, out, sections: [...document.querySelectorAll('main section')].map((s, i) => ({ id: s.id || 'section-' + (i + 1), index: i })) };
  });
  if (result.overflow) failures.push(`scrollWidth overflow at ${width}px, reducedMotion=${reducedMotion}`);
  if (result.out.length) console.log(`Out-of-bounds at ${width}px (${reducedMotion}):`, JSON.stringify(result.out));
  await mkdir(path.join(outDir, String(width)), { recursive: true });
  for (const section of result.sections) {
    const locator = page.locator('main section').nth(section.index);
    await locator.screenshot({ path: path.join(outDir, String(width), `${section.id}.png`), animations: 'disabled', timeout: 15000 }).catch(async error => {
      await mkdir(path.join(outDir, String(width)), { recursive: true });
      console.warn(`Could not capture ${section.id} at ${width}px: ${error.message}`);
    });
  }
  await context.close();
}

try {
  for (const width of widths) await run(width);
  await run(390, 'reduce');
  await run(1440, 'reduce');
} finally {
  await browser.close();
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log('No document horizontal overflow detected. Screenshots saved in qa/depois/.');
