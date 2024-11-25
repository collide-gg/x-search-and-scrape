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

  // Domain mapping for X Pro cookies
  const domainMap = {
    '.twitter.com': '.x.com',
    'twitter.com': '.x.com',
    '.x.com': '.x.com'
  };

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith('#') || !line.trim()) continue;

    const parts = line.split('\t');
    if (parts.length < 7) continue;

    const [domain, httpOnly, cookiePath, secure, expiry, name, value] = parts;
    
    // Map the domain correctly
    const mappedDomain = domainMap[domain] || domain;
    
    // Create cookie object with both .x.com and .twitter.com domains
    const cookieBase = {
      name,
      value,
      path: cookiePath,
      secure: secure.toLowerCase() === 'true',
      httpOnly: httpOnly.toLowerCase() === 'true',
      expiry: parseInt(expiry, 10)
    };

    // Add cookie for .x.com domain
    cookies.push({
      ...cookieBase,
      domain: mappedDomain
    });

    // Add same cookie for .twitter.com domain if it's a critical cookie
    if (['auth_token', 'ct0', 'personalization_id'].includes(name)) {
      cookies.push({
        ...cookieBase,
        domain: '.twitter.com'
      });
    }
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
    let criticalCookiesLoaded = new Set();

    for (const file of txtFiles) {
      const filePath = path.join(cookiesPath, file);
      const cookieData = await fs.readFile(filePath, 'utf8');
      
      const cookies = parseNetscapeCookies(cookieData);
      
      for (const cookie of cookies) {
        try {
          await driver.manage().addCookie(cookie);
          totalCookiesLoaded++;
          
          // Track critical cookies
          if (['auth_token', 'ct0', 'personalization_id'].includes(cookie.name)) {
            criticalCookiesLoaded.add(cookie.name);
          }
          
          logger.debug(`Added cookie: ${cookie.name} for domain: ${cookie.domain}`);
        } catch (cookieError) {
          logger.warn(`Failed to add cookie ${cookie.name} for domain ${cookie.domain}:`, cookieError.message);
        }
      }
    }
    
    // Verify critical cookies
    if (criticalCookiesLoaded.size < 3) {
      logger.warn('Not all critical cookies were loaded:', {
        loaded: Array.from(criticalCookiesLoaded),
        missing: ['auth_token', 'ct0', 'personalization_id'].filter(c => !criticalCookiesLoaded.has(c))
      });
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