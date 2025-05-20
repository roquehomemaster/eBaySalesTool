const axios = require('axios');

(async () => {
    try {
        const response = await axios.get('http://localhost:5000/api/items');
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
})();