import { InfinityIntelligenceSystem } from './core/InfinityIntelligenceSystem';
import { Logger } from './utils/Logger';

const logger = new Logger();

async function main() {
  try {
    logger.info('Starting Infinity Intelligence System...');
    
    const system = new InfinityIntelligenceSystem();
    await system.initialize();
    await system.start();
    
    logger.info('Infinity Intelligence System started successfully');
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down Infinity Intelligence System...');
      await system.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Shutting down Infinity Intelligence System...');
      await system.stop();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start Infinity Intelligence System', error);
    process.exit(1);
  }
}

main();