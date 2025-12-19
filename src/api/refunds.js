import { API_BASE_URL, getHeaders, handleResponse } from './config';

/**
 * Lấy danh sách refund requests (Admin)
 * @param {Object} params - Query parameters { status, event_id, page, limit }
 * @returns {Promise}
 */
export const getRefunds = async (params = {}) => {
  const queryString = new URLSearchParams();
  
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryString.append(key, params[key]);
    }
  });

  const url = `${API_BASE_URL}/refunds${queryString.toString() ? `?${queryString.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(true),
  });

  return handleResponse(response);
};

/**
 * Lấy chi tiết refund request
 * @param {string} refundId
 * @returns {Promise}
 */
export const getRefundDetail = async (refundId) => {
  const response = await fetch(`${API_BASE_URL}/refunds/${refundId}`, {
    method: 'GET',
    headers: getHeaders(true),
  });

  return handleResponse(response);
};

/**
 * Lấy refund requests của user hiện tại (Customer)
 * @param {Object} params - Query parameters { status, page, limit }
 * @returns {Promise}
 */
export const getMyRefunds = async (params = {}) => {
  const queryString = new URLSearchParams();
  
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryString.append(key, params[key]);
    }
  });

  const url = `${API_BASE_URL}/refunds/my/refunds${queryString.toString() ? `?${queryString.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(true),
  });

  return handleResponse(response);
};

