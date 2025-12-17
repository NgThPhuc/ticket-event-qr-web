import { API_BASE_URL, getHeaders, handleResponse } from './config';

/**
 * Lấy danh sách RevenueShare cho admin
 * @param {{ status?: 'PENDING' | 'AVAILABLE' | 'PAID_OUT' | 'CANCELLED' }} params
 * @returns {Promise<Array>}
 */
export const getRevenueShares = async (params = {}) => {
  const query = new URLSearchParams();

  if (params.status) {
    query.set('status', params.status);
  }

  const qs = query.toString();
  const url = `${API_BASE_URL}/revenue-shares${qs ? `?${qs}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(true),
  });

  return handleResponse(response);
};


