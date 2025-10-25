import { bootstrap } from './server';
import { Logger } from '@/utils/logger';

/**
 * Main application entry point
 * Bootstraps the Love OKLCH Backend with freemium entitlement system
 */
async function main(): Promise<void> {
  const logger = new Logger('Main');
  
  try {
    logger.info('Starting Love OKLCH Backend...');
    logger.info('Freemium Entitlement System v1.0.0');
    
    // Bootstrap the server
    const server = await bootstrap();
    
    logger.info('Application started successfully');
    
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});