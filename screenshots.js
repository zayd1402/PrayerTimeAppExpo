const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function takeScreenshots() {
  console.log('Launching browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 }
  });
  const page = await context.newPage();
  
  const filePath = 'file://' + path.resolve(__dirname, 'preview-v3.html');
  console.log('Loading:', filePath);
  
  await page.goto(filePath);
  await page.waitForLoadState('networkidle');
  console.log('Page loaded');
  
  const outputDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  const screens = ['today', 'prayers', 'journey', 'mosques', 'dua', 'settings'];
  
  // Light theme
  console.log('Setting light theme...');
  await page.evaluate(() => {
    document.querySelector('.device').setAttribute('data-theme', 'light');
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.theme-btn[data-theme="light"]').classList.add('active');
  });
  await page.waitForTimeout(200);
  
  for (const screen of screens) {
    console.log(`Capturing ${screen} light...`);
    await page.evaluate((screenName) => {
      const tab = document.querySelector(`.tab-item[data-screen="${screenName}"]`);
      if (tab) tab.click();
    }, screen);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outputDir, `${screen}-light.png`), fullPage: false });
  }
  
  // Dark theme
  console.log('Setting dark theme...');
  await page.evaluate(() => {
    document.querySelector('.device').setAttribute('data-theme', 'dark');
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.theme-btn[data-theme="dark"]').classList.add('active');
  });
  await page.waitForTimeout(200);
  
  for (const screen of screens) {
    console.log(`Capturing ${screen} dark...`);
    await page.evaluate((screenName) => {
      const tab = document.querySelector(`.tab-item[data-screen="${screenName}"]`);
      if (tab) tab.click();
    }, screen);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outputDir, `${screen}-dark.png`), fullPage: false });
  }
  
  await browser.close();
  console.log('All screenshots captured!');
}

takeScreenshots().catch(console.error);