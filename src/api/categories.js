// Categories API
import { API_BASE_URL, getHeaders, handleResponse } from './config';

/**
 * Lấy danh sách categories (public - chỉ active)
 */
export const getCategories = async () => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'GET',
        headers: getHeaders(false),
    });
    return handleResponse(response);
};

/**
 * Lấy tất cả categories (admin - bao gồm inactive)
 */
export const getAllCategories = async () => {
    const response = await fetch(`${API_BASE_URL}/categories/all`, {
        method: 'GET',
        headers: getHeaders(true),
    });
    return handleResponse(response);
};

/**
 * Lấy chi tiết category theo ID
 */
export const getCategoryById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'GET',
        headers: getHeaders(false),
    });
    return handleResponse(response);
};

/**
 * Lấy category theo slug
 */
export const getCategoryBySlug = async (slug) => {
    const response = await fetch(`${API_BASE_URL}/categories/slug/${slug}`, {
        method: 'GET',
        headers: getHeaders(false),
    });
    return handleResponse(response);
};

/**
 * Tạo category mới (admin)
 * @param {Object} data - { name, description?, icon?, color?, order?, is_active? }
 */
export const createCategory = async (data) => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

/**
 * Cập nhật category (admin)
 * @param {string} id - Category ID
 * @param {Object} data - Fields to update
 */
export const updateCategory = async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

/**
 * Toggle trạng thái active của category (admin)
 */
export const toggleCategoryActive = async (id) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}/toggle-active`, {
        method: 'PATCH',
        headers: getHeaders(true),
    });
    return handleResponse(response);
};

/**
 * Xóa category (admin)
 */
export const deleteCategory = async (id) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: getHeaders(true),
    });
    return handleResponse(response);
};
