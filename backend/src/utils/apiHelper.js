const axios = require('axios');

const apiHelper = {
    async makeGetRequest(url) {
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('Error making GET request:', error);
            throw error;
        }
    },

    async makePostRequest(url, data) {
        try {
            const response = await axios.post(url, data);
            return response.data;
        } catch (error) {
            console.error('Error making POST request:', error);
            throw error;
        }
    },

    async makePutRequest(url, data) {
        try {
            const response = await axios.put(url, data);
            return response.data;
        } catch (error) {
            console.error('Error making PUT request:', error);
            throw error;
        }
    },

    async makeDeleteRequest(url) {
        try {
            const response = await axios.delete(url);
            return response.data;
        } catch (error) {
            console.error('Error making DELETE request:', error);
            throw error;
        }
    }
};

module.exports = apiHelper;