import { API_BASE_URL, getHeaders, handleResponse } from './config';

/**
 * Dashboard Analytics API
 * Base URL: /dashboard
 */

// ==================== ORGANIZER DASHBOARD ====================

/**
 * Get organization overview statistics
 * @param {string} organizationId - Organization UUID
 * @returns {Promise} Organization overview data
 */
export const getOrganizationOverview = async (organizationId) => {
  const response = await fetch(
    `${API_BASE_URL}/dashboard/organizations/${organizationId}/overview`,
    {
      method: 'GET',
      headers: getHeaders(true),
    }
  );
  return handleResponse(response);
};

/**
 * Get organization events with statistics
 * @param {string} organizationId - Organization UUID
 * @returns {Promise} List of events with stats
 */
export const getOrganizationEvents = async (organizationId) => {
  const response = await fetch(
    `${API_BASE_URL}/dashboard/organizations/${organizationId}/events`,
    {
      method: 'GET',
      headers: getHeaders(true),
    }
  );
  return handleResponse(response);
};

/**
 * Get organization sales chart data
 * @param {string} organizationId - Organization UUID
 * @param {string} period - Period: 'day', 'week', 'month', 'year'
 * @returns {Promise} Sales chart data
 */
export const getOrganizationSales = async (organizationId, period = 'month') => {
  const response = await fetch(
    `${API_BASE_URL}/dashboard/organizations/${organizationId}/sales?period=${period}`,
    {
      method: 'GET',
      headers: getHeaders(true),
    }
  );
  return handleResponse(response);
};

// ==================== EVENT DASHBOARD ====================

/**
 * Get event overview statistics
 * @param {string} eventId - Event UUID
 * @returns {Promise} Event overview data including sales and check-in stats
 */
export const getEventOverview = async (eventId) => {
  const response = await fetch(
    `${API_BASE_URL}/dashboard/events/${eventId}/overview`,
    {
      method: 'GET',
      headers: getHeaders(true),
    }
  );
  return handleResponse(response);
};

/**
 * Get event sales breakdown
 * @param {string} eventId - Event UUID
 * @returns {Promise} Sales by ticket type and by date
 */
export const getEventSales = async (eventId) => {
  const response = await fetch(
    `${API_BASE_URL}/dashboard/events/${eventId}/sales`,
    {
      method: 'GET',
      headers: getHeaders(true),
    }
  );
  return handleResponse(response);
};

// ==================== PLATFORM ADMIN DASHBOARD ====================

/**
 * Get platform-wide overview (PLATFORM_ADMIN only)
 * @returns {Promise} System overview statistics
 */
export const getAdminOverview = async () => {
  const response = await fetch(
    `${API_BASE_URL}/dashboard/admin/overview`,
    {
      method: 'GET',
      headers: getHeaders(true),
    }
  );
  return handleResponse(response);
};

/**
 * Get top organizations by revenue (PLATFORM_ADMIN only)
 * @param {number} limit - Number of organizations to return
 * @returns {Promise} Top organizations list
 */
export const getAdminOrganizations = async (limit = 10) => {
  const response = await fetch(
    `${API_BASE_URL}/dashboard/admin/organizations?limit=${limit}`,
    {
      method: 'GET',
      headers: getHeaders(true),
    }
  );
  return handleResponse(response);
};

/**
 * Get top events by revenue (PLATFORM_ADMIN only)
 * @param {number} limit - Number of events to return
 * @param {string} period - Period: 'day', 'week', 'month', 'year'
 * @returns {Promise} Top events list
 */
export const getAdminEvents = async (limit = 10, period = 'month') => {
  const response = await fetch(
    `${API_BASE_URL}/dashboard/admin/events?limit=${limit}&period=${period}`,
    {
      method: 'GET',
      headers: getHeaders(true),
    }
  );
  return handleResponse(response);
};

/**
 * Get platform sales chart data (PLATFORM_ADMIN only)
 * @param {string} period - Period: 'day', 'week', 'month', 'year'
 * @returns {Promise} Platform-wide sales chart data
 */
export const getAdminSales = async (period = 'month') => {
  const response = await fetch(
    `${API_BASE_URL}/dashboard/admin/sales?period=${period}`,
    {
      method: 'GET',
      headers: getHeaders(true),
    }
  );
  return handleResponse(response);
};
