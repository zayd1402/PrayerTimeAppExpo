const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function takeScreenshots() {
  console.log('Launching browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 }
  });
  const page = await context.newPage();
  
  const filePath = 'file://' + path.resolve(__dirname, 'preview-v5.html');
  console.log('Loading:', filePath);
  
  await page.goto(filePath, { waitUntil: 'networkidle' });
  console.log('Page loaded');
  
  const outputDir = path.join(__dirname, 'screenshots-v5');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  const screens = ['home', 'countdown', 'calendar', 'journey', 'qibla', 'settings'];
  
  // Light theme
  await page.evaluate(() => {
    document.querySelector('.device').setAttribute('data-theme', 'light');
  });
  await page.waitForTimeout(200);
  
  for (const screen of screens) {
    console.log(`Capturing ${screen} light...`);
    await page.evaluate((s) => {
      const tab = document.querySelector(`.nav-item[data-screen="${s}"]`);
      if (tab) tab.click();
    }, screen);
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(outputDir, `${screen}-light.png`), fullPage: false });
  }
  
  // Dark theme
  await page.evaluate(() => {
    document.querySelector('.device').setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(200);
  
  for (const screen of screens) {
    console.log(`Capturing ${screen} dark...`);
    await page.evaluate((s) => {
      const tab = document.querySelector(`.nav-item[data-screen="${s}"]`);
      if (tab) tab.click();
    }, screen);
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(outputDir, `${screen}-dark.png`), fullPage: false });
  }
  
  await browser.close();
  console.log('All screenshots captured!');
  process.exit(0);
}

takeScreenshots().catch(e => { console.error(e); process.exit(1); });