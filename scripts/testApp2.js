const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle0' });
  
  // click assessment mode
  await page.click('input[name="mode"][value="full"]');
  console.log("Clicked assessment mode radio");
  
  await page.waitForTimeout(500); // Wait for UI update
  
  // click start button
  await page.click('#btn-start-full');
  console.log("Clicked start button");
  
  await page.waitForTimeout(2000);
  console.log("Done waiting");
  
  await browser.close();
})();
