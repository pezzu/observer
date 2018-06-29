const puppeteer = require('puppeteer');

async function getHtml(url, navigate) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url);

  if(typeof navigate === 'function') {
    await navigate(page);
  }

  const content = await page.content();
  await page.close();

  return content;
}


module.exports = {
  getHtml: getHtml
};