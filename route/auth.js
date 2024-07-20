const express = require('express');
const router = express.Router();
const { login } = require('../controllers/AuthController'); 
const { updateProfile, changePassword } = require('../controllers/penggunaController');

// Route untuk login
router.post('/login', login);
router.put('/ubahPassword/:id', changePassword);
// Endpoint untuk update profil pengguna
router.put('/pengguna/:id', updateProfile);

module.exports = router;
