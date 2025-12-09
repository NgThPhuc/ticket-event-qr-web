import { API_BASE_URL, getHeaders, handleResponse } from './config';

/**
 * Tạo event mới
 * @param {Object} data - Event data
 * @returns {Promise}
 */
export const createEvent = async (data) => {
  const response = await fetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

/**
 * Lấy danh sách events
 * @param {Object} params - Query parameters { organization_id, status, attendance_mode, page, limit, sort, q, ... }
 * @returns {Promise}
 */
export const getEvents = async (params = {}) => {
  const queryString = new URLSearchParams();
  
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryString.append(key, params[key]);
    }
  });

  const url = `${API_BASE_URL}/events${queryString.toString() ? `?${queryString.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(true),
  });

  return handleResponse(response);
};

/**
 * Lấy chi tiết event theo ID
 * @param {string} eventId
 * @param {string} expand - Comma-separated list: organization,ticket_types,creator
 * @returns {Promise}
 */
export const getEventById = async (eventId, expand = '') => {
  const queryString = expand ? `?expand=${expand}` : '';
  const response = await fetch(`${API_BASE_URL}/events/${eventId}${queryString}`, {
    method: 'GET',
    headers: getHeaders(true),
  });

  return handleResponse(response);
};

/**
 * Lấy event theo slug (public endpoint)
 * @param {string} slug
 * @param {string} expand - Comma-separated list: organization,ticket_types
 * @returns {Promise}
 */
export const getEventBySlug = async (slug, expand = '') => {
  // Thử endpoint /events/slug/:slug trước
  try {
    const queryString = expand ? `?expand=${expand}` : '';
    // Gửi token nếu có (để access full data), nhưng vẫn cho phép public access
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/events/slug/${slug}${queryString}`, {
      method: 'GET',
      headers: getHeaders(!!token), // Gửi auth nếu có token
    });

    if (response.ok) {
      return handleResponse(response);
    }
    
    // Nếu response không ok, throw error để fallback
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  } catch (err) {
    // Nếu endpoint /events/slug/:slug không tồn tại hoặc lỗi, thử lấy từ /events/public
    console.log('Endpoint /events/slug/:slug không khả dụng, thử lấy từ /events/public');
    
    // Fallback: Lấy từ /events/public và filter theo slug
    const response = await fetch(`${API_BASE_URL}/events/public?limit=100`, {
      method: 'GET',
      headers: getHeaders(false), // Public endpoint - không cần auth
    });

    const data = await handleResponse(response);
    
    // Tìm event có slug khớp
    const events = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []);
    const event = events.find(e => e.slug === slug);
    
    if (event) {
      return event;
    }

    throw new Error('Không tìm thấy sự kiện');
  }
};

/**
 * Lấy danh sách events công khai (public endpoint - không cần authentication)
 * @param {Object} params - Query parameters { attendance_mode, q, page, limit, sort, ... }
 * @returns {Promise}
 */
export const getPublicEvents = async (params = {}) => {
  const queryString = new URLSearchParams();
  
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryString.append(key, params[key]);
    }
  });

  const url = `${API_BASE_URL}/events/public${queryString.toString() ? `?${queryString.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(false), // Public endpoint - không cần auth
  });

  return handleResponse(response);
};

/**
 * Cập nhật event (full update)
 * @param {string} eventId
 * @param {Object} data - Event data
 * @returns {Promise}
 */
export const updateEvent = async (eventId, data) => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

/**
 * Cập nhật event (partial update)
 * @param {string} eventId
 * @param {Object} data - Partial event data
 * @returns {Promise}
 */
export const patchEvent = async (eventId, data) => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
    method: 'PATCH',
    headers: getHeaders(true),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

/**
 * Xóa event
 * @param {string} eventId
 * @returns {Promise}
 */
export const deleteEvent = async (eventId) => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
    method: 'DELETE',
    headers: getHeaders(true),
  });

  if (response.status === 204) {
    return null; // No content
  }

  return handleResponse(response);
};

/**
 * Publish event
 * @param {string} eventId
 * @param {string} idempotencyKey - Optional idempotency key
 * @returns {Promise}
 */
export const publishEvent = async (eventId, idempotencyKey = '') => {
  const headers = getHeaders(true);
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const response = await fetch(`${API_BASE_URL}/events/${eventId}/publish`, {
    method: 'POST',
    headers,
  });

  return handleResponse(response);
};

/**
 * Hủy event
 * @param {string} eventId
 * @param {Object} data - { reason, notify_attendees }
 * @returns {Promise}
 */
export const cancelEvent = async (eventId, data = {}) => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/cancel`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

/**
 * Đánh dấu event hoàn thành
 * @param {string} eventId
 * @returns {Promise}
 */
export const completeEvent = async (eventId) => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/complete`, {
    method: 'POST',
    headers: getHeaders(true),
  });

  return handleResponse(response);
};

