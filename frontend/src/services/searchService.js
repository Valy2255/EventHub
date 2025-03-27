// src/services/searchService.js
import api from './api';

/**
 * Service to handle search-related functionality and recently viewed events
 */
const searchService = {
  /**
   * Get recently viewed events from localStorage
   * @returns {Array} Array of recently viewed event objects
   */
  getRecentlyViewedEvents: () => {
    try {
      const recentlyViewed = localStorage.getItem('recentlyViewedEvents');
      return recentlyViewed ? JSON.parse(recentlyViewed) : [];
    } catch (error) {
      console.error('Error fetching recently viewed events:', error);
      return [];
    }
  },

  /**
   * Add an event to recently viewed events
   * @param {Object} event - Event object to add
   */
  addToRecentlyViewed: (event) => {
    try {
      if (!event || !event.id) return;
      
      const recentlyViewed = searchService.getRecentlyViewedEvents();
      
      // Check if event already exists
      const existingIndex = recentlyViewed.findIndex(e => e.id === event.id);
      
      // If exists, remove it so we can add it to the top
      if (existingIndex !== -1) {
        recentlyViewed.splice(existingIndex, 1);
      }
      
      // Create event object with consistent properties
      const eventToAdd = {
        id: event.id,
        name: event.name,
        category: typeof event.category === 'object' ? event.category.name : event.category,
        image_url: event.image_url,
        venue: event.venue || '',
        city: event.city || '',
        // Store coordinates if available
        latitude: event.latitude || null,
        longitude: event.longitude || null
      };
      
      // Add to beginning of array
      recentlyViewed.unshift(eventToAdd);
      
      // Keep only the most recent 5 events
      const trimmedList = recentlyViewed.slice(0, 5);
      
      localStorage.setItem('recentlyViewedEvents', JSON.stringify(trimmedList));
      
      // Track event view on server (optional)
      searchService.trackEventView(event.id).catch(error => {
        console.error('Error tracking event view:', error);
      });
      
      return trimmedList;
    } catch (error) {
      console.error('Error adding to recently viewed events:', error);
      return searchService.getRecentlyViewedEvents();
    }
  },

  /**
   * Remove an event from recently viewed events
   * @param {number} eventId - ID of event to remove
   */
  removeFromRecentlyViewed: (eventId) => {
    try {
      const recentlyViewed = searchService.getRecentlyViewedEvents();
      const updated = recentlyViewed.filter(event => event.id !== eventId);
      localStorage.setItem('recentlyViewedEvents', JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error('Error removing from recently viewed events:', error);
      return searchService.getRecentlyViewedEvents();
    }
  },

  /**
   * Clear all recently viewed events
   */
  clearRecentlyViewed: () => {
    try {
      localStorage.removeItem('recentlyViewedEvents');
      return [];
    } catch (error) {
      console.error('Error clearing recently viewed events:', error);
      return [];
    }
  },

  /**
   * Perform a search query to the backend API
   * @param {Object} params - Search parameters
   * @returns {Promise} Promise with search results
   */
  searchEvents: async (params) => {
    try {
      // Log the search parameters for debugging
      console.log('Searching with params:', params);
      
      // Clean up params by removing empty values
      const cleanParams = {};
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          // Format coordinates properly
          if ((key === 'lat' || key === 'lng') && typeof value === 'number') {
            cleanParams[key] = value.toFixed(6);
          } else {
            cleanParams[key] = value;
          }
        }
      });
      
      console.log('Clean params:', cleanParams);
      
      const response = await api.get('/search/events', { params: cleanParams });
      
      // Extract distance information if available and format it
      if (response.data && response.data.events) {
        response.data.events = response.data.events.map(event => {
          if (event.distance) {
            // Round to 1 decimal place and add formatted distance string
            event.distance = Math.round(event.distance * 10) / 10;
            event.distanceFormatted = `${event.distance} km away`;
          }
          return event;
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Search API error:', error);
      throw error;
    }
  },

  /**
   * Perform a quick search query for the header search bar and suggestions
   * @param {string} query - Search query text
   * @returns {Promise} Promise with search results
   */
  quickSearch: async (query) => {
    try {
      if (!query || query.trim().length < 2) {
        return { success: true, count: 0, events: [] };
      }

      const response = await api.get('/search/quick', { params: { q: query } });
      return response.data;
    } catch (error) {
      console.error('Quick search API error:', error);
      throw error;
    }
  },

  /**
   * Track when a user views an event
   * @param {number} eventId - ID of the event viewed
   * @returns {Promise} Promise with tracking response
   */
  trackEventView: async (eventId) => {
    try {
      const response = await api.post(`/search/track-view/${eventId}`);
      
      // If we get venue and city data from the server, update the localStorage entry
      if (response.data?.success && response.data?.event) {
        const event = response.data.event;
        const recentlyViewed = searchService.getRecentlyViewedEvents();
        
        // Find existing event and update it with additional data
        const existingIndex = recentlyViewed.findIndex(e => e.id === eventId);
        if (existingIndex !== -1) {
          recentlyViewed[existingIndex] = {
            ...recentlyViewed[existingIndex],
            venue: event.venue || recentlyViewed[existingIndex].venue,
            city: event.city || recentlyViewed[existingIndex].city,
            // Add coordinates if available
            latitude: event.latitude || recentlyViewed[existingIndex].latitude,
            longitude: event.longitude || recentlyViewed[existingIndex].longitude
          };
          
          localStorage.setItem('recentlyViewedEvents', JSON.stringify(recentlyViewed));
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Error tracking event view:', error);
      // We suppress the error here as this is a non-critical operation
      return null;
    }
  },
  
  /**
   * Get distance between two coordinates in kilometers
   * Uses Haversine formula to calculate distance
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point  
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number|null} Distance in kilometers or null if invalid coordinates
   */
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    // Convert string coordinates to numbers if needed
    const latitude1 = typeof lat1 === 'string' ? parseFloat(lat1) : lat1;
    const longitude1 = typeof lon1 === 'string' ? parseFloat(lon1) : lon1;
    const latitude2 = typeof lat2 === 'string' ? parseFloat(lat2) : lat2;
    const longitude2 = typeof lon2 === 'string' ? parseFloat(lon2) : lon2;
    
    // Validation check
    if (isNaN(latitude1) || isNaN(longitude1) || isNaN(latitude2) || isNaN(longitude2)) {
      console.error('Invalid coordinates:', { lat1, lon1, lat2, lon2 });
      return null;
    }
    
    // Earth's radius in kilometers
    const R = 6371;
    
    // Convert latitude and longitude from degrees to radians
    const dLat = (latitude2 - latitude1) * Math.PI / 180;
    const dLon = (longitude2 - longitude1) * Math.PI / 180;
    
    // Apply Haversine formula
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(latitude1 * Math.PI / 180) * Math.cos(latitude2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }
};

export default searchService;