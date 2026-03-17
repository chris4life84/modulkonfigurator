/**
 * Base URL for the backend API.
 * In production, this should point to the same domain (e.g. https://modul-garten.de).
 * An empty string means "same origin" which works when frontend and API share the same domain.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
