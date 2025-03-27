// backend/scripts/geocodeMaintenance.js
import * as geocodingService from '../services/geocodingService.js';
import * as db from '../config/db.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Check the geocoding status of all events
 */
const checkGeocodingStatus = async () => {
  try {
    console.log('Checking geocoding status for all events...');
    
    // Get all events
    const events = await geocodingService.getAllEvents();
    
    // Separate events into geocoded and non-geocoded
    const geocoded = events.filter(e => e.latitude && e.longitude);
    const nonGeocoded = events.filter(e => !e.latitude || !e.longitude);
    
    console.log('============================================');
    console.log(`Total events: ${events.length}`);
    console.log(`Geocoded events: ${geocoded.length} (${((geocoded.length / events.length) * 100).toFixed(2)}%)`);
    console.log(`Non-geocoded events: ${nonGeocoded.length} (${((nonGeocoded.length / events.length) * 100).toFixed(2)}%)`);
    console.log('============================================');
    
    if (nonGeocoded.length > 0) {
      console.log('Events without coordinates:');
      nonGeocoded.forEach(e => {
        console.log(`- ID: ${e.id}, Venue: "${e.venue}", City: "${e.city}"`);
      });
    }
    
  } catch (error) {
    console.error('Error checking geocoding status:', error.message);
  }
};

/**
 * Geocode a specific event by ID
 * @param {number} eventId - The ID of the event to geocode
 */
const geocodeSpecificEvent = async (eventId) => {
  try {
    console.log(`Geocoding event with ID ${eventId}...`);
    
    // Get event details
    const { rows } = await db.query(
      'SELECT id, venue, address, city FROM events WHERE id = $1',
      [eventId]
    );
    
    if (rows.length === 0) {
      console.error(`Event with ID ${eventId} not found`);
      return;
    }
    
    const event = rows[0];
    console.log(`Event found: "${event.venue}" in ${event.city}`);
    
    // Construct a full address
    const fullAddress = `${event.venue}, ${event.address}, ${event.city}`;
    
    // Geocode the address
    const coordinates = await geocodingService.geocodeAddress(fullAddress);
    
    if (!coordinates) {
      console.log(`Failed to geocode with full address. Trying with city only: ${event.city}`);
      const cityCoordinates = await geocodingService.geocodeAddress(event.city);
      
      if (cityCoordinates) {
        const success = await geocodingService.updateEventCoordinates(event.id, cityCoordinates);
        if (success) {
          console.log(`Successfully updated event ${event.id} with city-level coordinates`);
        } else {
          console.log(`Failed to update event ${event.id} in database`);
        }
      } else {
        console.log(`Could not geocode even the city. Event ${event.id} remains without coordinates`);
      }
    } else {
      const success = await geocodingService.updateEventCoordinates(event.id, coordinates);
      if (success) {
        console.log(`Successfully updated event ${event.id} with precise coordinates`);
      } else {
        console.log(`Failed to update event ${event.id} in database`);
      }
    }
    
  } catch (error) {
    console.error(`Error geocoding event ${eventId}:`, error.message);
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
  
  // Get command line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'status') {
    await checkGeocodingStatus();
  } else if (command === 'geocode' && args[1]) {
    const eventId = parseInt(args[1]);
    if (isNaN(eventId)) {
      console.error('Error: Event ID must be a number');
      process.exit(1);
    }
    await geocodeSpecificEvent(eventId);
  } else {
    console.log('Available commands:');
    console.log('  node geocodeMaintenance.js status - Check geocoding status of all events');
    console.log('  node geocodeMaintenance.js geocode <event_id> - Geocode a specific event');
  }
  
  process.exit(0);
};

// Execute main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});