const { Builder } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const { logger } = require('../utils/logger');
const config = require('../../config.json');

async function initializeBrowser() {
  try {
    logger.info('Initializing Firefox browser...');
    
    const options = new firefox.Options();
    // Add Firefox options for better performance and stability
    options.addArguments(
      '--width=1920',
      '--height=1080'
    );

    // Set Firefox preferences
    options.setPreference('browser.download.folderList', 2);
    options.setPreference('browser.download.manager.showWhenStarting', false);
    options.setPreference('browser.helperApps.neverAsk.saveToDisk', 'application/json');
    
    // Add preferences to prevent notifications and other popups
    options.setPreference('dom.webnotifications.enabled', false);
    options.setPreference('dom.push.enabled', false);

    const driver = await new Builder()
      .forBrowser('firefox')
      .setFirefoxOptions(options)
      .build();

    // Maximize window for better visibility
    await driver.manage().window().maximize();

    // Navigate to X Pro
    await driver.get(config.scraping.baseUrl);
    logger.info('Firefox browser initialized successfully');
    
    return driver;
  } catch (error) {
    logger.error('Failed to initialize Firefox browser:', error);
    throw error;
  }
}

module.exports = {
  initializeBrowser
}; 