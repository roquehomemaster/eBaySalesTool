// Central CORS middleware for the backend
// Use the official cors package for best compatibility
const cors = require('cors');
module.exports = cors({
  origin: '*',
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  optionsSuccessStatus: 200
});
