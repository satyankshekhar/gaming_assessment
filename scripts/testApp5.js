const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle0' });
  
  await page.evaluate(() => {
     document.querySelector('input[name="mode"][value="full"]').parentElement.click();
  });
  await new Promise(r => setTimeout(r, 500));
  
  await page.click('#btn-start-full');
  await new Promise(r => setTimeout(r, 2000));
  
  await page.click('#btn-pathfinding-submit');
  await new Promise(r => setTimeout(r, 1000));
  
  await browser.close();
  console.log("TEST FINISHED");
})();
