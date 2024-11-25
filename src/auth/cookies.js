const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../utils/logger');

/**
 * Parse Netscape format cookies
 * Format: domain\tHTTPONLY flag\tpath\tSECURE flag\texpiry\tname\tvalue
 */
function parseNetscapeCookies(content) {
  const cookies = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith('#') || !line.trim()) continue;

    const parts = line.split('\t');
    if (parts.length < 7) continue;

    const [domain, httpOnly, cookiePath, secure, expiry, name, value] = parts;
    
    cookies.push({
      name,
      value,
      domain: domain.startsWith('.') ? domain : '.' + domain,
      path: cookiePath,
      secure: secure.toLowerCase() === 'true',
      httpOnly: httpOnly.toLowerCase() === 'true',
      expiry: parseInt(expiry, 10)
    });
  }

  return cookies;
}

async function loadCookies(driver) {
  try {
    const cookiesPath = path.join(process.cwd(), 'data/cookies');
    const cookieFiles = await fs.readdir(cookiesPath);
    
    const txtFiles = cookieFiles.filter(file => file.endsWith('.txt'));
    if (txtFiles.length === 0) {
      throw new Error('No .txt cookie files found in data/cookies directory');
    }

    // Delete all existing cookies first
    await driver.manage().deleteAllCookies();
    logger.info('Cleared existing cookies');

    let totalCookiesLoaded = 0;

    for (const file of txtFiles) {
      const filePath = path.join(cookiesPath, file);
      const cookieData = await fs.readFile(filePath, 'utf8');
      
      // Check if file is empty or only contains comments
      const nonCommentLines = cookieData.split('\n')
        .filter(line => line.trim() && !line.startsWith('#'));
      
      if (nonCommentLines.length === 0) {
        logger.warn(`Cookie file ${file} is empty or contains only comments`);
        continue;
      }

      const cookies = parseNetscapeCookies(cookieData);
      
      if (cookies.length === 0) {
        logger.warn(`No valid cookies found in ${file}`);
        continue;
      }

      for (const cookie of cookies) {
        try {
          await driver.manage().addCookie(cookie);
          totalCookiesLoaded++;
          logger.debug(`Added cookie: ${cookie.name}`);
        } catch (cookieError) {
          logger.warn(`Failed to add cookie ${cookie.name}:`, cookieError.message);
        }
      }
    }
    
    if (totalCookiesLoaded === 0) {
      throw new Error('No cookies were successfully loaded');
    }

    logger.info(`Successfully loaded ${totalCookiesLoaded} cookies`);

    // Verify cookies were set
    const currentCookies = await driver.manage().getCookies();
    logger.info(`Total cookies set: ${currentCookies.length}`);

    // Refresh the page to apply cookies
    await driver.navigate().refresh();
    logger.info('Page refreshed to apply cookies');

  } catch (error) {
    logger.error('Failed to load cookies:', error);
    throw error;
  }
}

module.exports = { loadCookies }; 