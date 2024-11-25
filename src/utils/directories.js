const fs = require('fs').promises;
const path = require('path');
const { logger } = require('./logger');

const requiredDirs = [
  'data',
  'data/cookies',
  'data/output'
];

async function ensureDirectoriesExist() {
  try {
    for (const dir of requiredDirs) {
      const dirPath = path.join(process.cwd(), dir);
      
      try {
        await fs.access(dirPath);
        logger.debug(`Directory exists: ${dir}`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          await fs.mkdir(dirPath, { recursive: true });
          await fs.chmod(dirPath, 0o755);
          logger.info(`Created directory: ${dir}`);
        } else {
          throw error;
        }
      }
    }
    
    const cookiesPath = path.join(process.cwd(), 'data/cookies/cookies.txt');
    try {
      await fs.access(cookiesPath);
      logger.debug('cookies.txt exists');
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.writeFile(cookiesPath, 
          '# Netscape HTTP Cookie File\n' +
          '# https://curl.haxx.se/rfc/cookie_spec.html\n' +
          '# This is a generated file!  Do not edit.\n\n'
        );
        await fs.chmod(cookiesPath, 0o644);
        logger.info('Created cookies.txt template');
      } else {
        throw error;
      }
    }
    
    logger.info('All required directories and files verified');
  } catch (error) {
    logger.error('Error ensuring directories exist:', error);
    throw error;
  }
}

module.exports = {
  ensureDirectoriesExist,
  requiredDirs
}; 