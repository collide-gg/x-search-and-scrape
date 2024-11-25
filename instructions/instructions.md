# Project Overview
- This project is a bot that will be used to automate the process of searching, scrolling, and scraping columns on tweetdeck/x pro (pro.twitter.com). The project uses JavaScript and Selenium WebDriver for scraping.

# Core Functionalities
## Cookies Login
- The bot uses cookies stored in `data/cookies` directory to authenticate with X Pro
- Cookie loading is handled by `src/auth/cookies.js`
- Each cookie file should be in JSON format

## Column Identification
- Using specific selectors defined in `config.json`, the bot identifies columns present in the current deck
- The deck should be preconfigured to only have columns for search
- Column identification is handled in `src/scraper/columnScraper.js`

## Per Column Searching 
- The bot inputs keywords from the `config.json` keywords array to search in each column
- Search functionality is implemented in `searchAndScrapeColumn` function

## Per Column Scraping
- Scraping quota limits are configurable via `config.json`
- Scroll delay between tweet loads is configurable
- Data is processed and filtered by search keywords

## Data Processing
- Scraped data is saved in the `data` directory as JSON files
- Each file is named according to the keyword used for filtering
- Output path is configurable in `config.json`

## Termination
- Bot terminates after all columns have been scraped and reached quota
- Error handling and logging is implemented using Winston

# Documentation
## Column Identification
```
async findColumns() {
        try {
            let columns = await this.driver.findElements(
                By.css('div[data-testid="multi-column-layout-column-content"]')
            );

            if (columns.length === 0) {
                await this.driver.sleep(8000);
                columns = await this.driver.findElements(
                    By.css('div[data-testid="multi-column-layout-column-content"]')
                );
            }

            return columns;
        } catch (error) {
            console.error('Error finding columns:', error);
            return [];
        }
    }
```


# Current File Structure
├── src/
│ ├── auth/
│ │ ├── browser.js
│ │ └── cookies.js
│ ├── scraper/
│ │ └── columnScraper.js
│ ├── utils/
│ │ └── logger.js
│ └── index.js
├── data/
│ └── cookies/
├── tests/
├── config.json
├── package.json
└── README.md

# Important Implementation Notes
xxxx