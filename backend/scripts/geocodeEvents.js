// backend/scripts/geocodeEvents.js
import * as geocodingService from '../services/geocodingService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Delay function to respect Google Maps API rate limits
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise}
 */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Geocode all events that don't have coordinates
 */
const geocodeAllEvents = async () => {
  try {
    console.log('Starting batch geocoding process...');
    
    // Get all events without coordinates
    const events = await geocodingService.getEventsWithoutCoordinates();
    
    if (events.length === 0) {
      console.log('No events found without coordinates. All events are already geocoded.');
      return;
    }
    
    console.log(`Found ${events.length} events to geocode.`);
    console.log('============================================');
    
    // Use a counter to track progress
    let successCount = 0;
    let failCount = 0;
    
    // Process each event
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      console.log(`Processing (${i+1}/${events.length}): "${event.venue}" in ${event.city}`);
      
      // Construct a full address from venue, address and city
      const fullAddress = `${event.venue}, ${event.address}, ${event.city}`;
      
      // Geocode the address
      const coordinates = await geocodingService.geocodeAddress(fullAddress);
      
      // If geocoding failed, try with just city
      if (!coordinates) {
        console.log(`  ↳ Failed with full address. Trying with just city: ${event.city}`);
        await delay(200); // Small delay before making another API call
        const cityCoordinates = await geocodingService.geocodeAddress(event.city);
        
        if (cityCoordinates) {
          // Update event with city-level coordinates
          const success = await geocodingService.updateEventCoordinates(event.id, cityCoordinates);
          if (success) {
            console.log(`  ↳ Successfully updated event ${event.id} with city-level coordinates`);
            successCount++;
          } else {
            console.log(`  ↳ Failed to update event ${event.id} in database`);
            failCount++;
          }
        } else {
          console.log(`  ↳ Could not geocode even the city. Skipping event ${event.id}`);
          failCount++;
        }
      } else {
        // Update event with precise coordinates
        const success = await geocodingService.updateEventCoordinates(event.id, coordinates);
        if (success) {
          console.log(`  ↳ Successfully updated event ${event.id} with precise coordinates`);
          successCount++;
        } else {
          console.log(`  ↳ Failed to update event ${event.id} in database`);
          failCount++;
        }
      }
      
      // Respect Google Maps API rate limits (typically 50 requests per second)
      // but we'll be conservative and wait 500ms between requests
      console.log('  ↳ Waiting 500ms before next request...');
      await delay(500);
    }
    
    console.log('============================================');
    console.log('Geocoding process completed!');
    console.log(`Successfully geocoded: ${successCount} events`);
    console.log(`Failed to geocode: ${failCount} events`);
    
  } catch (error) {
    console.error('Error in batch geocoding process:', error.message);
  }
};

/**
 * Main function
 */
const main = async () => {
  // Check if Google Maps API key is available
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.error('Error: Google Maps API key not found!');
    console.error('Please add GOOGLE_MAPS_API_KEY to your .env file');
    process.exit(1);
  }
  
  console.log('Google Maps API key found, proceeding with geocoding...');
  await geocodeAllEvents();
  process.exit(0);
};

// Execute main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});