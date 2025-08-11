import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Adjust the base URL as needed

const apiService = {
    createSale: async (saleData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/sales`, saleData);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error.message;
        }
    },

    getSales: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/sales`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error.message;
        }
    },

    updateSale: async (saleId, saleData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/sales/${saleId}`, saleData);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error.message;
        }
    },

    getCatalog: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/catalog`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error.message;
        }
    },

    // Fetch all listings (with optional filters and pagination)
    getListings: async (params = {}) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/listings`, { params });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error.message;
        }
    },
    getListingDetails: async (listingId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/listings/${listingId}/details`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error.message;
        }
    },
    // Fetch app configuration by key (e.g., 'listings.page_size')
    getAppConfigByKey: async (key) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/appconfig/key/${encodeURIComponent(key)}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error.message;
        }
    }
};

export default apiService;