const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function capture() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage({
    viewport: { width: 393, height: 852 }
  });

  await page.goto('file:///Users/Apple/ai-org/PrayerTimeAppExpo/preview-v8.html', {
    waitUntil: 'domcontentloaded'
  });
  await page.waitForTimeout(600);

  const outDir = path.join(__dirname, 'screenshots-v8');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const screens = ['home', 'countdown', 'calendar', 'journey', 'qibla', 'settings'];

  for (const s of screens) {
    console.log(`Capturing ${s}...`);
    await page.evaluate((name) => {
      const tab = document.querySelector(`.nav-item[data-screen="${name}"]`);
      if (tab) tab.click();
    }, s);
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(outDir, `${s}.png`),
      fullPage: false
    });
  }

  await browser.close();
  console.log('Done!');
  process.exit(0);
}

capture().catch(e => { console.error(e); process.exit(1); });