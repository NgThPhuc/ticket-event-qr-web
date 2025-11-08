import { API_BASE_URL, getHeaders, handleResponse } from './config';

/**
 * Tạo organization mới
 * @param {Object} data - { name, slug, description, contact_email, contact_phone, address, logo_url }
 * @returns {Promise}
 */
export const createOrganization = async (data) => {
  const response = await fetch(`${API_BASE_URL}/organizations`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

/**
 * Lấy danh sách organizations của user
 * @returns {Promise}
 */
export const getMyOrganizations = async () => {
  const response = await fetch(`${API_BASE_URL}/organizations/my-organizations`, {
    method: 'GET',
    headers: getHeaders(true),
  });

  return handleResponse(response);
};

/**
 * Lấy chi tiết organization
 * @param {string} organizationId
 * @returns {Promise}
 */
export const getOrganization = async (organizationId) => {
  const response = await fetch(`${API_BASE_URL}/organizations/${organizationId}`, {
    method: 'GET',
    headers: getHeaders(true),
  });

  return handleResponse(response);
};

/**
 * Cập nhật organization
 * @param {string} organizationId
 * @param {Object} data - { name, description, logo_url, website_url, ... }
 * @returns {Promise}
 */
export const updateOrganization = async (organizationId, data) => {
  const response = await fetch(`${API_BASE_URL}/organizations/${organizationId}`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

/**
 * Xóa organization
 * @param {string} organizationId
 * @returns {Promise}
 */
export const deleteOrganization = async (organizationId) => {
  const response = await fetch(`${API_BASE_URL}/organizations/${organizationId}`, {
    method: 'DELETE',
    headers: getHeaders(true),
  });

  return handleResponse(response);
};

/**
 * Lấy danh sách members của organization
 * @param {string} organizationId
 * @returns {Promise}
 */
export const getOrganizationMembers = async (organizationId) => {
  const response = await fetch(`${API_BASE_URL}/organizations/${organizationId}/members`, {
    method: 'GET',
    headers: getHeaders(true),
  });

  return handleResponse(response);
};

/**
 * Thêm member vào organization
 * @param {string} organizationId
 * @param {Object} data - { email, role }
 * @returns {Promise}
 */
export const addOrganizationMember = async (organizationId, data) => {
  const response = await fetch(`${API_BASE_URL}/organizations/${organizationId}/members`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

/**
 * Cập nhật role của member
 * @param {string} organizationId
 * @param {string} memberId
 * @param {Object} data - { role }
 * @returns {Promise}
 */
export const updateMemberRole = async (organizationId, memberId, data) => {
  const response = await fetch(`${API_BASE_URL}/organizations/${organizationId}/members/${memberId}/role`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

/**
 * Xóa member khỏi organization
 * @param {string} organizationId
 * @param {string} memberId
 * @returns {Promise}
 */
export const removeOrganizationMember = async (organizationId, memberId) => {
  const response = await fetch(`${API_BASE_URL}/organizations/${organizationId}/members/${memberId}`, {
    method: 'DELETE',
    headers: getHeaders(true),
  });

  return handleResponse(response);
};

/**
 * Lấy tất cả organizations (chỉ PLATFORM_ADMIN)
 * @returns {Promise}
 */
export const getAllOrganizations = async () => {
  const response = await fetch(`${API_BASE_URL}/organizations`, {
    method: 'GET',
    headers: getHeaders(true),
  });

  return handleResponse(response);
};

