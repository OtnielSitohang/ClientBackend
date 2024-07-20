const express = require('express');
const router = express.Router();
const { login } = require('../controllers/AuthController'); // Import controller login

// Route untuk login
router.post('/login', login);

module.exports = router;
