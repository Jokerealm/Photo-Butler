#!/usr/bin/env node

/**
 * Database initialization script
 * This script can be run independently to set up the database
 */

import { databaseService } from '../services/databaseService';

async function initializeDatabase() {
  console.log('Starting database initialization...');
  
  try {
    const success = await databaseService.initialize();
    
    if (success) {
      console.log('✅ Database initialization completed successfully');
      
      // Perform health check
      const isHealthy = await databaseService.healthCheck();
      if (isHealthy) {
        console.log('✅ Database health check passed');
      } else {
        console.log('⚠️  Database health check failed');
      }
    } else {
      console.log('❌ Database initialization failed');
      console.log('The application will continue to work with localStorage only');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    console.log('The application will continue to work with localStorage only');
  } finally {
    // Close the connection
    await databaseService.close();
    process.exit(0);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  initializeDatabase();
}

export { initializeDatabase };