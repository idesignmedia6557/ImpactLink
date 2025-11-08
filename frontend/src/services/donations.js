/**
 * Donations API Service
 * Handles all donation-related API calls including Stripe payments
 */

import api from './api';

/**
 * Create a payment intent for one-time donation
 * @param {Object} donationData - { amount, projectId, paymentMethod }
 * @returns {Promise} - Payment intent with clientSecret
 */
export const createPaymentIntent = async (donationData) => {
  try {
    const response = await api.post('/donations/intent', donationData);
    return response.data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error.response?.data || error;
  }
};

/**
 * Confirm a donation after payment
 * @param {Object} confirmData - { paymentIntentId, projectId }
 * @returns {Promise} - Confirmed donation
 */
export const confirmDonation = async (confirmData) => {
  try {
    const response = await api.post('/donations/confirm', confirmData);
    return response.data;
  } catch (error) {
    console.error('Error confirming donation:', error);
    throw error.response?.data || error;
  }
};

/**
 * Create a recurring donation subscription
 * @param {Object} subscriptionData - { amount, projectId, frequency, paymentMethod }
 * @returns {Promise} - Created subscription
 */
export const createRecurringDonation = async (subscriptionData) => {
  try {
    const response = await api.post('/donations/recurring', subscriptionData);
    return response.data;
  } catch (error) {
    console.error('Error creating recurring donation:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get user's recurring donations
 * @returns {Promise} - List of recurring donations
 */
export const getRecurringDonations = async () => {
  try {
    const response = await api.get('/donations/recurring');
    return response.data;
  } catch (error) {
    console.error('Error fetching recurring donations:', error);
    throw error.response?.data || error;
  }
};

/**
 * Cancel a recurring donation
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise} - Cancellation confirmation
 */
export const cancelRecurringDonation = async (subscriptionId) => {
  try {
    const response = await api.delete(`/donations/recurring/${subscriptionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error cancelling subscription ${subscriptionId}:`, error);
    throw error.response?.data || error;
  }
};

/**
 * Get user's donation history
 * @param {Object} params - Query parameters (page, limit, status)
 * @returns {Promise} - Donations list
 */
export const getDonationHistory = async (params = {}) => {
  try {
    const response = await api.get('/users/me/donations', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching donation history:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get a single donation by ID
 * @param {string} donationId - Donation ID
 * @returns {Promise} - Donation details
 */
export const getDonationById = async (donationId) => {
  try {
    const response = await api.get(`/donations/${donationId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching donation ${donationId}:`, error);
    throw error.response?.data || error;
  }
};

/**
 * Get user's donation statistics
 * @returns {Promise} - Donation stats (total, count, breakdown)
 */
export const getDonationStats = async () => {
  try {
    const response = await api.get('/users/me/donation-stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching donation stats:', error);
    throw error.response?.data || error;
  }
};

/**
 * Request a refund for a donation (Admin only)
 * @param {string} donationId - Donation ID
 * @param {string} reason - Refund reason
 * @returns {Promise} - Refund confirmation
 */
export const requestRefund = async (donationId, reason) => {
  try {
    const response = await api.post(`/donations/${donationId}/refund`, { reason });
    return response.data;
  } catch (error) {
    console.error(`Error requesting refund for ${donationId}:`, error);
    throw error.response?.data || error;
  }
};

/**
 * Get all donations (Admin only)
 * @param {Object} params - Query parameters (page, limit, status, userId, projectId)
 * @returns {Promise} - All donations with pagination
 */
export const getAllDonations = async (params = {}) => {
  try {
    const response = await api.get('/donations', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching all donations:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get donation receipt
 * @param {string} donationId - Donation ID
 * @returns {Promise} - Receipt data or PDF URL
 */
export const getDonationReceipt = async (donationId) => {
  try {
    const response = await api.get(`/donations/${donationId}/receipt`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching receipt for ${donationId}:`, error);
    throw error.response?.data || error;
  }
};

export default {
  createPaymentIntent,
  confirmDonation,
  createRecurringDonation,
  getRecurringDonations,
  cancelRecurringDonation,
  getDonationHistory,
  getDonationById,
  getDonationStats,
  requestRefund,
  getAllDonations,
  getDonationReceipt
};
