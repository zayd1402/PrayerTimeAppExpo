const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function capture() {
  console.log('Launching...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-web-security']
  });
  const context = await browser.newContext({ viewport: { width: 393, height: 852 } });
  const page = await context.newPage();

  const filePath = 'file://' + path.resolve(__dirname, 'preview-v7.html');
  console.log('Loading:', filePath);
  await page.goto(filePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  console.log('Loaded');

  const outDir = path.join(__dirname, 'screenshots-v8');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const screens = ['home', 'countdown', 'calendar', 'journey', 'qibla', 'settings'];

  // Light theme only
  await page.evaluate(() => {
    document.querySelector('.device').setAttribute('data-theme', 'light');
  });
  await page.waitForTimeout(300);

  for (const s of screens) {
    console.log(`Capturing ${s}...`);
    await page.evaluate((name) => {
      const tab = document.querySelector(`.nav-item[data-screen="${name}"]`);
      if (tab) tab.click();
    }, s);
    await page.waitForTimeout(450);
    await page.screenshot({ path: path.join(outDir, `${s}.png`), fullPage: false });
  }

  await browser.close();
  console.log('Done!');
  process.exit(0);
}

capture().catch(e => { console.error(e); process.exit(1); });