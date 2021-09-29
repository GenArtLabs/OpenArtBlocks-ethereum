const webdriver = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const { readFileSync, promises } = require('fs');
const { writeFile, access } = promises;

const HTML_p5 = readFileSync('templates/p5_render.html').toString();

const buildDriver = () => {
  let options = new firefox.Options();

  //Don't forget to add these for heroku
  options.headless();
  // options.addArguments("--disable-gpu");
  // options.addArguments("--no-sandbox");


  let driver = new webdriver.Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .build();
  return driver;
}
const driver = buildDriver();

const render = async (script, tokenHash, count) => {
  const htmlContent = HTML_p5.replace('{{INJECT_SCRIPT_HERE}}', script).replace('{{INJECT_HASH_HERE}}', tokenHash).replace('{{INJECT_COUNT_HERE}}', count);

  await driver.get("data:text/html;base64," + Buffer.from(htmlContent, 'utf-8').toString('base64'));

  const b64Img = await driver.executeAsyncScript("wait(arguments[0]);");//arguments[arguments.length - 1]

  const path = `generated/${tokenHash}.png`;
  console.log(path);
  await writeFile(path, b64Img, { encoding: 'base64' });
  return path;
}

const getStaticImagePath = async (script, tokenHash, count) => {
  const path = `generated/${tokenHash}.png`;
  try {
    await access(path);
  } catch {
    await render(script, tokenHash, count);
  }
  return path;
}


module.exports = { getStaticImagePath };