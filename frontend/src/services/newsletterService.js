// src/services/newsletterService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const newsletterService = {
  /**
   * Subscribe a user to the newsletter
   * @param {string} email - User's email address
   * @returns {Promise} - Promise with the response data
   */
  subscribe: async (email) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/newsletter/subscribe`, { email });
      return response.data;
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      throw error;
    }
  }
};

export default newsletterService;