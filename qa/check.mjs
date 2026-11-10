import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';

const baseURL = process.env.QA_URL || 'http://127.0.0.1:4173';
const widths = [360, 390, 430, 768, 1024, 1280, 1440, 1920];
const outDir = path.resolve('qa/depois');
const failures = [];
await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--remote-debugging-port=0'] });

async function run(width, reducedMotion = 'no-preference') {
  const height = width === 390 ? 844 : width < 768 ? 800 : 900;
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver(list => list.getEntries().forEach(entry => { if (!entry.hadRecentInput) window.__cls += entry.value; })).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(5600);
  const result = await page.evaluate((expectedCheckout) => {
    const ctas = [...document.querySelectorAll('[data-cta]')].map(el => ({ text: el.innerText.trim(), href: el.href }));
    const brokenAnchors = [...document.querySelectorAll('a[href="#"]')].map(a => a.outerHTML.slice(0, 160));
    const todoText = document.body.innerText.includes('TODO');
    const overflow = document.documentElement.scrollWidth > window.innerWidth;
    const hero = document.querySelector('#hero');
    const heading = hero.querySelector('h1').getBoundingClientRect();
    const lede = hero.querySelector('.hero-lede').getBoundingClientRect();
    const cta = hero.querySelector('[data-cta]').getBoundingClientRect();
    const heroPinned = hero.parentElement?.classList.contains('pin-spacer') || !!hero.querySelector('.pin-spacer');
    const anchorTargets = [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href').slice(1)).filter(id => id && !document.getElementById(id));
    return { ctas, brokenAnchors, todoText, overflow, headingBottom: heading.bottom, ledeBottom: lede.bottom, ctaTop: cta.top, heroPinned, anchorTargets, cls: window.__cls, wrongCtas: ctas.filter(cta => cta.href !== expectedCheckout) };
  }, config.checkoutUrl);
  if (result.wrongCtas.length) failures.push(`Checkout mismatch at ${width}px: ${JSON.stringify(result.wrongCtas)}`);
  if (result.brokenAnchors.length || result.anchorTargets.length) failures.push(`Broken internal links at ${width}px`);
  if (result.todoText) failures.push(`Visible TODO text at ${width}px`);
  if (result.overflow) failures.push(`Horizontal overflow at ${width}px`);
  if (result.heroPinned) failures.push(`Hero pin detected at ${width}px`);
  if (result.headingBottom > height || result.ledeBottom > height) failures.push(`Hero heading/subtitle is below the first viewport at ${width}px`);
  if (width === 1440 && result.ctaTop > height) failures.push('Desktop hero CTA is below the first viewport');
  if (width === 390 && (result.ctaTop > height + 380 || result.ctaTop < 0)) failures.push('Mobile hero CTA needs more than a short scroll');
  if (result.cls > 0.1) failures.push(`Hero/page CLS exceeded 0.1 at ${width}px (${result.cls})`);
  if (errors.length) failures.push(`JavaScript errors at ${width}px: ${errors.join('; ')}`);

  const suffix = reducedMotion === 'reduce' ? '-reduce' : '';
  const dir = path.join(outDir, String(width) + suffix);
  await mkdir(dir, { recursive: true });
  await page.locator('#hero').screenshot({ path: path.join(dir, 'hero.png'), animations: 'disabled' });
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await page.locator('.site-footer').screenshot({ path: path.join(dir, 'footer.png'), animations: 'disabled' });
  const terms = await page.request.get(new URL('./termos.html', baseURL).toString());
  const privacy = await page.request.get(new URL('./privacidade.html', baseURL).toString());
  if (!terms.ok() || !privacy.ok()) failures.push(`Legal pages failed at ${width}px`);
  console.log(`${width}px ${reducedMotion}: ${result.overflow ? 'OVERFLOW' : 'no overflow'}, ${result.ctas.length} CTAs, CLS ${result.cls.toFixed(3)}`);
  await context.close();
}

try {
  for (const width of widths) await run(width);
  await run(390, 'reduce');
  await run(1440, 'reduce');
  const lighthouseModule = await import('lighthouse');
  const lighthouse = lighthouseModule.default;
  const port = Number(new URL(browser.wsEndpoint()).port);
  const report = await lighthouse(baseURL, { port, output: 'json', onlyCategories: ['performance', 'accessibility'], formFactor: 'mobile', screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 1, disabled: false } });
  const scores = { performance: Math.round(report.lhr.categories.performance.score * 100), accessibility: Math.round(report.lhr.categories.accessibility.score * 100) };
  console.log('Lighthouse mobile:', JSON.stringify(scores));
  if (scores.performance < 85 || scores.accessibility < 95) failures.push(`Lighthouse thresholds failed: ${JSON.stringify(scores)}`);
} finally {
  await browser.close();
}

if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log('All viewport, checkout, hero, link, legal-page and Lighthouse checks passed. Screenshots: qa/depois/.');
