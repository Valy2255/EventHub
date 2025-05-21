// backend/scripts/testRefunds.js
import { processRefunds } from '../utils/scheduledTasks.js';

// The main function to run the test
const runTest = async () => {
  try {
    console.log('Starting manual refund processing test...');
    
    // Process refunds with a custom threshold (e.g., 0 days to process all)
    const processedRefunds = await processRefunds(0); // Use 0 to test all processing refunds regardless of time
    
    console.log(`Processed ${processedRefunds.length} refunds`);
    console.log('Processed refunds:', processedRefunds);
    
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

// Run the test
runTest();