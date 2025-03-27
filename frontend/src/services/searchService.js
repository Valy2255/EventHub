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
        city: event.city || ''
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
      // Clean up params by removing empty values to avoid unnecessary query parameters
      const cleanParams = {};
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          cleanParams[key] = value;
        }
      });
      
      const response = await api.get('/search/events', { params: cleanParams });
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
            city: event.city || recentlyViewed[existingIndex].city
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
  }
};

export default searchService;