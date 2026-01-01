// My Tickets API
import { API_BASE_URL, getHeaders, handleResponse } from './config';

/**
 * Lấy danh sách vé của tôi
 * @param {Object} params - Query parameters { status, checkin_status, event_id }
 * @returns {Promise}
 */
export const getMyTickets = async (params = {}) => {
    const queryString = new URLSearchParams();

    Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            queryString.append(key, params[key]);
        }
    });

    const url = `${API_BASE_URL}/my-tickets${queryString.toString() ? `?${queryString.toString()}` : ''}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(true),
    });

    return handleResponse(response);
};

/**
 * Lấy chi tiết vé theo ID
 * @param {string} ticketId - ID của vé
 * @returns {Promise}
 */
export const getMyTicketById = async (ticketId) => {
    const response = await fetch(`${API_BASE_URL}/my-tickets/${ticketId}`, {
        method: 'GET',
        headers: getHeaders(true),
    });

    return handleResponse(response);
};

/**
 * Tra cứu vé theo QR Payload
 * @param {string} qrPayload - Nội dung QR code
 * @returns {Promise}
 */
export const getMyTicketByQR = async (qrPayload) => {
    const response = await fetch(`${API_BASE_URL}/my-tickets/qr/${qrPayload}`, {
        method: 'GET',
        headers: getHeaders(true),
    });

    return handleResponse(response);
};
