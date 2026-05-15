const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function capture() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Capture each reference image
  const files = fs.readdirSync('/Users/Apple/ai-org/PrayerTimeAppExpo/refs');
  const images = files.filter(f => f.endsWith('.png'));

  for (const imgFile of images) {
    const outPath = `/Users/Apple/ai-org/PrayerTimeAppExpo/refs/capture-${imgFile.replace(/[^a-z0-9]/gi, '_')}.png`;

    const page = await browser.newPage();
    await page.setContent(`
      <html>
      <body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;height:100vh">
        <img src="${imgFile}" style="max-width:100%;max-height:100%" />
      </html>
    `, { baseUrl: `file:///Users/Apple/ai-org/PrayerTimeAppExpo/refs/` });

    await page.waitForTimeout(1000);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Captured: ${outPath}`);
    await page.close();
  }

  await browser.close();
  console.log('All reference images captured!');
  process.exit(0);
}

capture().catch(e => { console.error(e); process.exit(1); });