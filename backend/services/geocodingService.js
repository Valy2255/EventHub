// src/services/geocodingService.js
import axios from 'axios';
import * as db from '../config/db.js';

// Replace with your actual API key
const GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY_HERE';

/**
 * Geocode an address or city to get coordinates
 * @param {string} address - Address or city to geocode
 * @returns {Promise<{lat: number, lng: number} | null>} - Coordinates or null if not found
 */
export const geocodeAddress = async (address) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location;
      return { lat, lng };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
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
    if (!coordinates) return false;
    
    const { lat, lng } = coordinates;
    
    await db.query(
      'UPDATE events SET latitude = $1, longitude = $2 WHERE id = $3',
      [lat, lng, eventId]
    );
    
    return true;
  } catch (error) {
    console.error('Error updating event coordinates:', error);
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
    
    return rows;
  } catch (error) {
    console.error('Error fetching events without coordinates:', error);
    return [];
  }
};