// File: gravitypress/src/api/polarGraph.js
const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/test', (req, res) => {
  res.json({ message: "Polar Graph API is working!" });
});

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Add other routes as needed

module.exports = router;