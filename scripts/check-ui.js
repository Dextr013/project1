const puppeteer = require('puppeteer');

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function runCheck(url, tag) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  const errors = [];

  const IGNORE_PATTERNS = [
    /No parent to post message/i,
  ];

  function shouldIgnore(msg) {
    return IGNORE_PATTERNS.some((re) => re.test(msg));
  }

  page.on('console', (msg) => {
    const text = `[console.${msg.type()}] ${msg.text()}`;
    if (msg.type() === 'error' && !shouldIgnore(text)) errors.push(text);
  });
  page.on('pageerror', (err) => {
    const text = `[pageerror] ${err.message}`;
    if (!shouldIgnore(text)) errors.push(text);
  });
  page.on('requestfailed', (req) => {
    const f = req.failure();
    const u = req.url();
    if (/favicon\.ico$/i.test(u)) return; // ignore missing favicon
    errors.push(`[requestfailed] ${f?.errorText || 'fail'} ${u}`);
  });

  await page.setViewport({ width: 960, height: 1200, deviceScaleFactor: 1 });

  // Do not aggressively block Yandex SDK; only block ad/metrics
  try {
    await page.route('**/*', (route) => {
      const u = route.request().url();
      if (/doubleclick|adservice|googletagmanager|google-analytics|mc\.yandex|metrika/i.test(u)) return route.abort();
      return route.continue();
    });
  } catch {}

  const startedAt = Date.now();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (e) {
    errors.push(`[nav] ${e.message}`);
  }

  try {
    await page.waitForSelector('#app', { timeout: 15000 });
    // wait until preloader hides or app is visible
    await page.waitForFunction(() => {
      const app = document.querySelector('#app');
      const pre = document.querySelector('#preloader');
      const appVisible = app && !app.classList.contains('hidden') && getComputedStyle(app).display !== 'none';
      const preHidden = !pre || pre.classList.contains('hidden') || getComputedStyle(pre).display === 'none';
      return appVisible && preHidden;
    }, { timeout: 15000 });
  } catch (e) {
    errors.push(`[ui] app not visible in time: ${e.message}`);
  }

  // Basic canvas checks
  let canvasBox = null;
  try {
    await page.waitForSelector('#game-canvas', { timeout: 15000 });
    canvasBox = await page.$eval('#game-canvas', (el) => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    if (!canvasBox || canvasBox.w < 200 || canvasBox.h < 200) {
      errors.push(`[canvas] unexpected size: ${JSON.stringify(canvasBox)}`);
    }
  } catch (e) {
    errors.push(`[canvas] ${e.message}`);
  }

  // HUD presence
  try {
    await page.waitForSelector('.hud', { timeout: 8000 });
  } catch (e) {
    errors.push(`[hud] ${e.message}`);
  }

  // Interact: New Game, open/close Settings
  try {
    const hasNew = await page.$('#btn-new');
    if (hasNew) {
      await page.click('#btn-new');
      await sleep(300);
      await page.keyboard.press('ArrowRight');
      await sleep(200);
    }
  } catch (e) {
    errors.push(`[interact] new/start: ${e.message}`);
  }

  try {
    const hasSettings = await page.$('#btn-settings');
    if (hasSettings) {
      await page.click('#btn-settings');
      await page.waitForSelector('#settings-overlay:not(.hidden)', { timeout: 5000 });
      await page.click('#btn-settings-close');
      await sleep(200);
    }
  } catch (e) {
    errors.push(`[interact] settings: ${e.message}`);
  }

  // Screenshot
  try {
    await page.screenshot({ path: `/workspace/screenshots/${tag}.png`, fullPage: true });
  } catch (e) {
    errors.push(`[screenshot] ${e.message}`);
  }

  const elapsed = Date.now() - startedAt;
  await browser.close();
  return { url, ok: errors.length === 0, errors, elapsed, canvasBox };
}

(async () => {
  const urls = process.argv.slice(2);
  const list = urls.length ? urls : ['http://127.0.0.1:8080/', 'http://127.0.0.1:8081/'];
  const results = [];
  for (const u of list) {
    const tag = u.includes('8081') ? 'dist' : 'root';
    try {
      const r = await runCheck(u, tag);
      results.push(r);
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(r));
    } catch (e) {
      const r = { url: u, ok: false, errors: [e.message] };
      results.push(r);
      console.log(JSON.stringify(r));
    }
  }
  const failed = results.filter(r => !r.ok);
  if (failed.length) process.exit(1);
})();