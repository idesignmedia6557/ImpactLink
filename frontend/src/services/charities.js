/**
 * Charities API Service
 * Handles all charity-related API calls
 */

import api from './api';

/**
 * Get all charities with optional filters
 * @param {Object} params - Query parameters (page, limit, category, search, verificationStatus)
 * @returns {Promise} - Charities list with pagination
 */
export const getCharities = async (params = {}) => {
  try {
    const response = await api.get('/charities', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching charities:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get a single charity by ID
 * @param {string} charityId - Charity ID
 * @returns {Promise} - Charity details
 */
export const getCharityById = async (charityId) => {
  try {
    const response = await api.get(`/charities/${charityId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching charity ${charityId}:`, error);
    throw error.response?.data || error;
  }
};

/**
 * Get projects for a specific charity
 * @param {string} charityId - Charity ID
 * @param {Object} params - Query parameters (page, limit, status)
 * @returns {Promise} - Projects list
 */
export const getCharityProjects = async (charityId, params = {}) => {
  try {
    const response = await api.get(`/charities/${charityId}/projects`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching projects for charity ${charityId}:`, error);
    throw error.response?.data || error;
  }
};

/**
 * Get statistics for a specific charity
 * @param {string} charityId - Charity ID
 * @returns {Promise} - Charity statistics
 */
export const getCharityStats = async (charityId) => {
  try {
    const response = await api.get(`/charities/${charityId}/stats`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching stats for charity ${charityId}:`, error);
    throw error.response?.data || error;
  }
};

/**
 * Create a new charity (Admin only)
 * @param {Object} charityData - Charity data
 * @returns {Promise} - Created charity
 */
export const createCharity = async (charityData) => {
  try {
    const response = await api.post('/charities', charityData);
    return response.data;
  } catch (error) {
    console.error('Error creating charity:', error);
    throw error.response?.data || error;
  }
};

/**
 * Update a charity (Admin/Charity only)
 * @param {string} charityId - Charity ID
 * @param {Object} updates - Updated fields
 * @returns {Promise} - Updated charity
 */
export const updateCharity = async (charityId, updates) => {
  try {
    const response = await api.put(`/charities/${charityId}`, updates);
    return response.data;
  } catch (error) {
    console.error(`Error updating charity ${charityId}:`, error);
    throw error.response?.data || error;
  }
};

/**
 * Delete a charity (Admin only)
 * @param {string} charityId - Charity ID
 * @returns {Promise} - Deletion confirmation
 */
export const deleteCharity = async (charityId) => {
  try {
    const response = await api.delete(`/charities/${charityId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting charity ${charityId}:`, error);
    throw error.response?.data || error;
  }
};

/**
 * Save/favorite a charity
 * @param {string} charityId - Charity ID
 * @returns {Promise} - Save confirmation
 */
export const saveCharity = async (charityId) => {
  try {
    const response = await api.post(`/charities/${charityId}/save`);
    return response.data;
  } catch (error) {
    console.error(`Error saving charity ${charityId}:`, error);
    throw error.response?.data || error;
  }
};

/**
 * Unsave/unfavorite a charity
 * @param {string} charityId - Charity ID
 * @returns {Promise} - Unsave confirmation
 */
export const unsaveCharity = async (charityId) => {
  try {
    const response = await api.delete(`/charities/${charityId}/save`);
    return response.data;
  } catch (error) {
    console.error(`Error unsaving charity ${charityId}:`, error);
    throw error.response?.data || error;
  }
};

/**
 * Get saved charities for current user
 * @returns {Promise} - Saved charities list
 */
export const getSavedCharities = async () => {
  try {
    const response = await api.get('/users/me/saved-charities');
    return response.data;
  } catch (error) {
    console.error('Error fetching saved charities:', error);
    throw error.response?.data || error;
  }
};

export default {
  getCharities,
  getCharityById,
  getCharityProjects,
  getCharityStats,
  createCharity,
  updateCharity,
  deleteCharity,
  saveCharity,
  unsaveCharity,
  getSavedCharities
};
