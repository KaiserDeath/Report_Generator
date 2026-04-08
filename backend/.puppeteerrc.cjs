const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Tells Puppeteer to install the browser inside a .cache folder in your project
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};