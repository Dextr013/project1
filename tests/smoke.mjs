import puppeteer from 'puppeteer';

const url = process.env.URL || 'http://127.0.0.1:8080/';

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
const page = await browser.newPage();
page.setDefaultTimeout(30000);

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#app', { visible: true });
await page.waitForSelector('#game-canvas', { visible: true });

const rect = await page.$eval('#game-canvas', (c) => ({ w: c.clientWidth, h: c.clientHeight }));
if (!(rect.w > 0 && rect.h > 0)) throw new Error('Canvas not visible');

const hudOk = await page.$eval('.hud', (el) => getComputedStyle(el).display !== 'none');
if (!hudOk) throw new Error('HUD hidden');

await page.click('#btn-new');

await page.keyboard.press('ArrowRight');
await page.keyboard.press('ArrowDown');
await page.keyboard.press('ArrowLeft');

const scoreVal = await page.$eval('#score', (el) => el.textContent.trim());
if (!/^\d+$/.test(scoreVal)) throw new Error('Score text invalid');

await page.click('#btn-settings');
await page.waitForSelector('#settings-overlay', { visible: true });
await page.waitForSelector('#mode-select');
await page.waitForSelector('#size-select');

await page.select('#bg-select', 'background17.webp').catch(()=>{});
await page.click('#btn-settings-close');

console.log('SMOKE_OK');
await browser.close();