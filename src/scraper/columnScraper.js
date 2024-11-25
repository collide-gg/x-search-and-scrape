const { By, until, Key } = require('selenium-webdriver');
const config = require('../../config.json');
const { logger } = require('../utils/logger');

async function findColumns(driver) {
  try {
    logger.info('Starting column search...');
    let columns = await driver.findElements(
      By.css('div[data-testid="multi-column-layout-column-content"]')
    );

    if (columns.length === 0) {
      logger.info('No columns found initially, waiting 8 seconds...');
      await driver.sleep(8000);
      columns = await driver.findElements(
        By.css('div[data-testid="multi-column-layout-column-content"]')
      );
    }

    logger.info(`Found ${columns.length} columns`);
    return columns;
  } catch (error) {
    logger.error('Error finding columns:', error);
    return [];
  }
}

async function focusSearchField(column, driver) {
  try {
    logger.info('Looking for search field...');
    
    // Wait for column to be fully loaded
    await driver.sleep(2000);
    
    // Log column HTML for debugging
    const columnHtml = await column.getAttribute('innerHTML');
    logger.debug('Column HTML:', columnHtml);
    
    // X Pro specific selectors for search field (updated)
    const searchSelectors = [
      // Primary selectors
      '[data-testid="searchBox"]',
      '[data-testid="search-box-input"]',
      '[data-testid="SearchBox_Search_Input"]',
      'input[placeholder*="Search"]',
      // Column header selectors
      '[data-column-id] input[type="text"]',
      '[data-testid*="column"] input',
      // DraftJS selectors
      '[contenteditable="true"]',
      '.DraftEditor-root',
      // Generic fallbacks
      'input[type="text"]',
      'textarea'
    ];

    // Try each selector with wait
    for (const selector of searchSelectors) {
      try {
        logger.debug(`Trying selector: ${selector}`);
        
        // Wait for element with timeout
        const searchField = await driver.wait(
          until.elementLocated(By.css(selector)),
          5000,
          `Timeout waiting for ${selector}`
        );
        
        if (await searchField.isDisplayed()) {
          logger.info(`Found search field with selector: ${selector}`);
          
          // Scroll element into view
          await driver.executeScript("arguments[0].scrollIntoView(true);", searchField);
          await driver.sleep(500);
          
          // Try to click the element
          await searchField.click();
          logger.info('Successfully clicked search field');
          
          // Verify focus
          const isEditable = await driver.executeScript(`
            return document.activeElement === arguments[0] ||
                   document.activeElement.contentEditable === 'true';
          `, searchField);
          
          if (isEditable) {
            logger.info('Search field focus verified');
            return true;
          }
        }
      } catch (selectorError) {
        logger.debug(`Selector ${selector} failed:`, selectorError.message);
      }
    }

    // Log all visible elements for debugging
    const allElements = await column.findElements(By.css('*'));
    for (const element of allElements) {
      try {
        const tag = await element.getTagName();
        const id = await element.getAttribute('id');
        const className = await element.getAttribute('class');
        const dataTestId = await element.getAttribute('data-testid');
        if (await element.isDisplayed()) {
          logger.debug('Visible element:', { tag, id, className, dataTestId });
        }
      } catch (e) {} // Ignore stale elements
    }

    throw new Error('Could not find interactive search field with any known selector');
  } catch (error) {
    logger.error('Error focusing search field:', error);
    return false;
  }
}

async function submitSearch(column, keyword, driver) {
  try {
    logger.info(`Attempting to submit search for keyword: ${keyword}`);
    
    // Wait for a moment to ensure the search field is properly focused
    await driver.sleep(1000);
    
    // X Pro specific query submit button selector
    const submitQuerySelector = '[aria-label="Submit query"][role="button"]';
    
    try {
      logger.debug('Looking for submit query button...');
      const submitButton = await column.findElement(By.css(submitQuerySelector));
      
      if (await submitButton.isDisplayed()) {
        logger.info('Found submit query button');
        
        // Scroll button into view and click
        await driver.executeScript("arguments[0].scrollIntoView(true);", submitButton);
        await driver.sleep(500);
        await submitButton.click();
        logger.info('Clicked submit query button');
        
        // Wait for search results to load
        await driver.sleep(2000);
        
        return true;
      } else {
        logger.warn('Submit query button found but not visible');
      }
    } catch (e) {
      logger.error('Error finding submit query button:', e.message);
      // Log column HTML for debugging
      const columnHtml = await column.getAttribute('innerHTML');
      logger.debug('Column HTML:', columnHtml);
      throw new Error('Submit query button not found');
    }
  } catch (error) {
    logger.error('Error submitting search:', error);
    throw error;
  }
}

async function searchAndScrapeColumn(column, keyword, driver) {
  try {
    logger.info(`Processing column for keyword: ${keyword}`);
    
    // Focus the search field
    const searchFocused = await focusSearchField(column, driver);
    if (!searchFocused) {
      throw new Error('Failed to focus search field');
    }

    // Add a small delay after focusing
    await driver.sleep(1000);

    // Clear existing search text
    await driver.actions()
      .keyDown(Key.CONTROL)
      .sendKeys('a')
      .keyUp(Key.CONTROL)
      .sendKeys(Key.BACK_SPACE)
      .perform();

    logger.info('Cleared existing search text');

    // Type the search keyword
    await driver.actions().sendKeys(keyword).perform();
    logger.info(`Entered search keyword: ${keyword}`);

    // Submit the search
    const searchSubmitted = await submitSearch(column, keyword, driver);
    if (!searchSubmitted) {
      throw new Error('Failed to submit search');
    }

    // Wait for search results
    await driver.sleep(2000);
    
    // TODO: Implement scraping logic here
    
  } catch (error) {
    logger.error(`Error in searchAndScrapeColumn: ${error.message}`);
    throw error;
  }
}

async function scrapeColumns(driver) {
  try {
    const columns = await findColumns(driver);
    
    if (columns.length === 0) {
      throw new Error('No columns found to scrape');
    }
    
    logger.info(`Beginning to process ${columns.length} columns`);
    
    for (const [index, column] of columns.entries()) {
      logger.info(`Processing column ${index + 1} of ${columns.length}`);
      for (const keyword of config.scraping.keywords) {
        await searchAndScrapeColumn(column, keyword, driver);
      }
    }
  } catch (error) {
    logger.error('Error scraping columns:', error);
    throw error;
  }
}

module.exports = { 
  scrapeColumns,
  findColumns,
  focusSearchField
}; 