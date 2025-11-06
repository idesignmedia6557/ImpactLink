import axios from 'axios';

// Get API base URL from environment variable or use default
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ===== DONATION ENDPOINTS =====

/**
 * Create a new donation
 * @param {Object} donationData - Donation details
 * @returns {Promise} Donation response with clientSecret
 */
export const createDonation = async (donationData) => {
  const response = await apiClient.post('/donations', donationData);
  return response.data;
};

/**
 * Get all donations with optional filters
 * @param {Object} filters - Query parameters (status, campaignId, donorEmail, etc.)
 * @returns {Promise} List of donations
 */
export const getDonations = async (filters = {}) => {
  const response = await apiClient.get('/donations', { params: filters });
  return response.data;
};

/**
 * Get a single donation by ID
 * @param {string} donationId - Donation ID
 * @returns {Promise} Donation details
 */
export const getDonationById = async (donationId) => {
  const response = await apiClient.get(`/donations/${donationId}`);
  return response.data;
};

/**
 * Refund a donation
 * @param {string} donationId - Donation ID
 * @param {string} reason - Refund reason
 * @returns {Promise} Refund response
 */
export const refundDonation = async (donationId, reason) => {
  const response = await apiClient.post(`/donations/${donationId}/refund`, { reason });
  return response.data;
};

/**
 * Get donation statistics
 * @param {Object} filters - Query parameters (campaignId, startDate, endDate)
 * @returns {Promise} Donation stats
 */
export const getDonationStats = async (filters = {}) => {
  const response = await apiClient.get('/donations/stats/summary', { params: filters });
  return response.data;
};

// ===== USER DASHBOARD ENDPOINTS =====

/**
 * Get user's donation history
 * @param {string} email - User email
 * @returns {Promise} User's donations
 */
export const getUserDonations = async (email) => {
  return getDonations({ donorEmail: email });
};

/**
 * Get user's impact score and statistics
 * @param {string} email - User email
 * @returns {Promise} User impact data
 */
export const getUserImpact = async (email) => {
  // This would call a user-specific endpoint when implemented
  // For now, we'll get donations and calculate locally
  const donations = await getUserDonations(email);
  
  const totalDonated = donations.donations?.reduce((sum, d) => sum + d.amount, 0) || 0;
  const donationCount = donations.total || 0;
  const completedDonations = donations.donations?.filter(d => d.status === 'completed').length || 0;
  
  return {
    totalDonated,
    donationCount,
    completedDonations,
    donations: donations.donations || []
  };
};

// ===== CHARITY/PROJECT ENDPOINTS =====
// Note: These endpoints would need to be implemented in the backend
// For now, we'll return mock data or handle gracefully

/**
 * Get all charities/projects
 * @returns {Promise} List of charities
 */
export const getCharities = async () => {
  try {
    const response = await apiClient.get('/charities');
    return response.data;
  } catch (error) {
    // If endpoint doesn't exist, return empty array
    console.warn('Charities endpoint not yet implemented');
    return { success: true, charities: [] };
  }
};

/**
 * Get charity by ID
 * @param {string} charityId - Charity ID
 * @returns {Promise} Charity details
 */
export const getCharityById = async (charityId) => {
  try {
    const response = await apiClient.get(`/charities/${charityId}`);
    return response.data;
  } catch (error) {
    console.warn('Charity endpoint not yet implemented');
    return { success: false, error: 'Charity not found' };
  }
};

/**
 * Get charity donations
 * @param {string} charityId - Charity ID
 * @returns {Promise} Charity's donations
 */
export const getCharityDonations = async (charityId) => {
  return getDonations({ campaignId: charityId });
};

// Export default apiClient for custom requests
export default apiClient;
