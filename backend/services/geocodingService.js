// src/services/geocodingService.js
import axios from 'axios';
import * as db from '../config/db.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get API key from environment variables for better security
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Check if API key is available
if (!GOOGLE_MAPS_API_KEY) {
  console.error('Google Maps API key is missing! Set GOOGLE_MAPS_API_KEY in your .env file');
}

/**
 * Geocode an address or city to get coordinates
 * @param {string} address - Address or city to geocode
 * @returns {Promise<{lat: number, lng: number} | null>} - Coordinates or null if not found
 */
export const geocodeAddress = async (address) => {
  if (!address || address.trim() === '') {
    console.error('Empty address provided for geocoding');
    return null;
  }

  try {
    console.log(`Geocoding address: ${address}`);
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    // Log response status for debugging
    console.log(`Geocoding status: ${response.data.status}`);

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location;
      console.log(`Found coordinates: (${lat}, ${lng})`);
      return { lat, lng };
    } else {
      console.warn(`Geocoding failed for address "${address}". Status: ${response.data.status}`);
      return null;
    }
  } catch (error) {
    console.error('Geocoding error:', error.message);
    // Check for rate limiting or API key issues
    if (error.response && error.response.status === 403) {
      console.error('Possible API key issues or rate limiting. Check your Google Cloud Console.');
    }
    return null;
  }
};

/**
 * Update event coordinates in the database
 * @param {number} eventId - ID of the event to update
 * @param {Object} coordinates - Coordinates {lat, lng}
 * @returns {Promise<boolean>} - Success status
 */
export const updateEventCoordinates = async (eventId, coordinates) => {
  try {
    if (!coordinates) {
      console.warn(`No coordinates provided for event ID ${eventId}`);
      return false;
    }
    
    const { lat, lng } = coordinates;
    
    console.log(`Updating event ${eventId} with coordinates: (${lat}, ${lng})`);
    
    const result = await db.query(
      'UPDATE events SET latitude = $1, longitude = $2 WHERE id = $3 RETURNING id',
      [lat, lng, eventId]
    );
    
    if (result.rows.length > 0) {
      console.log(`Successfully updated event ${eventId} with coordinates`);
      return true;
    } else {
      console.warn(`Event ${eventId} not found in database`);
      return false;
    }
  } catch (error) {
    console.error(`Error updating event ${eventId} coordinates:`, error.message);
    return false;
  }
};

/**
 * Get all events without coordinates
 * @returns {Promise<Array>} - List of events without coordinates
 */
export const getEventsWithoutCoordinates = async () => {
  try {
    const { rows } = await db.query(
      'SELECT id, venue, address, city FROM events WHERE (latitude IS NULL OR longitude IS NULL) AND status = \'active\''
    );
    
    console.log(`Found ${rows.length} events without coordinates`);
    return rows;
  } catch (error) {
    console.error('Error fetching events without coordinates:', error.message);
    return [];
  }
};

/**
 * Get all events
 * @returns {Promise<Array>} - List of all events
 */
export const getAllEvents = async () => {
  try {
    const { rows } = await db.query(
      'SELECT id, venue, address, city, latitude, longitude FROM events'
    );
    
    console.log(`Found ${rows.length} total events`);
    return rows;
  } catch (error) {
    console.error('Error fetching all events:', error.message);
    return [];
  }
};