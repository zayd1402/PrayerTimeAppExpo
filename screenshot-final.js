// ─── Screenshot capture for PrayerTimeAppExpo preview ────────
const { chromium } = require('playwright');
const path = require('path');

const VIEWPORT = { width: 390, height: 844 };
const OUTPUT = path.join(__dirname, 'screenshots');
const PREVIEW = 'file://' + path.join(__dirname, 'preview-final.html');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 3 });
  const page = await context.newPage();

  await page.goto(PREVIEW, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for fonts to load
  await page.waitForTimeout(3000);

  const screens = ['home', 'worship', 'calendar', 'duas', 'more'];
  for (const screen of screens) {
    // Click the tab button (data-tab attribute)
    await page.click(`button[data-tab="${screen}"]`, { timeout: 5000 });
    await page.waitForTimeout(1000);
    const filePath = `${OUTPUT}/${screen}.png`;
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`Captured: ${screen}.png`);
  }

  // Also capture Qibla via the More screen → Qibla
  // First go to More, then simulate... actually let's just capture the qibla tab
  // The qibla is not a tab - it's in the More menu. Let me capture it from the existing layout
  await page.click('button[data-tab="more"]', { timeout: 5000 });
  await page.waitForTimeout(500);
  // The More screen has its own grid, so it's captured above
  // Let me also capture hero in isolation (home screen focused on top)
  await page.click('button[data-tab="home"]', { timeout: 5000 });
  await page.waitForTimeout(500);
  // Scroll to top
  await page.evaluate(() => { document.querySelector('.screen-content.active')?.scrollTo(0, 0); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUTPUT}/hero-card.png`, fullPage: false });
  console.log('Captured: hero-card.png');

  // Qibla screenshot - go to /qibla via hash or just show the More screen
  await page.click('button[data-tab="more"]', { timeout: 5000 });
  await page.waitForTimeout(500);
  // Scroll down slightly to show the grid
  await page.evaluate(() => { document.querySelector('.screen-content.active')?.scrollTo(0, 100); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUTPUT}/more-grid.png`, fullPage: false });
  console.log('Captured: more-grid.png');

  await browser.close();
  console.log('All screenshots captured successfully.');
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
