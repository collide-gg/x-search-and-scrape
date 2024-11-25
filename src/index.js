const { initializeBrowser } = require('./auth/browser');
const { loadCookies } = require('./auth/cookies');
const { scrapeColumns } = require('./scraper/columnScraper');
const { ensureDirectoriesExist } = require('./utils/directories');
const { logger } = require('./utils/logger');
const config = require('../config.json');

async function main() {
  try {
    // Ensure all required directories exist before starting
    await ensureDirectoriesExist();
    
    const driver = await initializeBrowser();
    await loadCookies(driver);
    await scrapeColumns(driver);
  } catch (error) {
    logger.error('Bot execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main }; // Export for testing 