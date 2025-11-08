/**
 * Projects API Service
 * Handles all project-related API calls
 */

import api from './api';

/**
 * Get all projects with optional filters
 * @param {Object} params - Query parameters (page, limit, status, charityId, category)
 * @returns {Promise} - Projects list with pagination
 */
export const getProjects = async (params = {}) => {
  try {
    const response = await api.get('/projects', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get a single project by ID
 * @param {string} projectId - Project ID
 * @returns {Promise} - Project details
 */
export const getProjectById = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching project ${projectId}:`, error);
    throw error.response?.data || error;
  }
};

/**
 * Get donations for a specific project
 * @param {string} projectId - Project ID
 * @param {Object} params - Query parameters (page, limit)
 * @returns {Promise} - Donations list
 */
export const getProjectDonations = async (projectId, params = {}) => {
  try {
    const response = await api.get(`/projects/${projectId}/donations`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching donations for project ${projectId}:`, error);
    throw error.response?.data || error;
  }
};

/**
 * Get updates for a specific project
 * @param {string} projectId - Project ID
 * @param {Object} params - Query parameters (page, limit)
 * @returns {Promise} - Updates list
 */
export const getProjectUpdates = async (projectId, params = {}) => {
  try {
    const response = await api.get(`/projects/${projectId}/updates`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching updates for project ${projectId}:`, error);
    throw error.response?.data || error;
  }
};

/**
 * Get impact reports for a specific project
 * @param {string} projectId - Project ID
 * @returns {Promise} - Impact reports list
 */
export const getProjectImpactReports = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}/impact-reports`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching impact reports for project ${projectId}:`, error);
    throw error.response?.data || error;
  }
};

/**
 * Create a new project (Charity/Admin only)
 * @param {Object} projectData - Project data
 * @returns {Promise} - Created project
 */
export const createProject = async (projectData) => {
  try {
    const response = await api.post('/projects', projectData);
    return response.data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error.response?.data || error;
  }
};

/**
 * Update a project (Charity/Admin only)
 * @param {string} projectId - Project ID
 * @param {Object} updates - Updated fields
 * @returns {Promise} - Updated project
 */
export const updateProject = async (projectId, updates) => {
  try {
    const response = await api.put(`/projects/${projectId}`, updates);
    return response.data;
  } catch (error) {
    console.error(`Error updating project ${projectId}:`, error);
    throw error.response?.data || error;
  }
};

/**
 * Delete a project (Admin only)
 * @param {string} projectId - Project ID
 * @returns {Promise} - Deletion confirmation
 */
export const deleteProject = async (projectId) => {
  try {
    const response = await api.delete(`/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting project ${projectId}:`, error);
    throw error.response?.data || error;
  }
};

/**
 * Add an update to a project (Charity only)
 * @param {string} projectId - Project ID
 * @param {Object} updateData - Update content
 * @returns {Promise} - Created update
 */
export const addProjectUpdate = async (projectId, updateData) => {
  try {
    const response = await api.post(`/projects/${projectId}/updates`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Error adding update to project ${projectId}:`, error);
    throw error.response?.data || error;
  }
};

/**
 * Add an impact report to a project (Charity only)
 * @param {string} projectId - Project ID
 * @param {Object} reportData - Impact report data
 * @returns {Promise} - Created impact report
 */
export const addProjectImpactReport = async (projectId, reportData) => {
  try {
    const response = await api.post(`/projects/${projectId}/impact-reports`, reportData);
    return response.data;
  } catch (error) {
    console.error(`Error adding impact report to project ${projectId}:`, error);
    throw error.response?.data || error;
  }
};

export default {
  getProjects,
  getProjectById,
  getProjectDonations,
  getProjectUpdates,
  getProjectImpactReports,
  createProject,
  updateProject,
  deleteProject,
  addProjectUpdate,
  addProjectImpactReport
};
