const express = require('express');
const router = express.Router();
const { login } = require('../controllers/AuthController'); 
const { updateProfile, changePassword } = require('../controllers/penggunaController');
const { checkAvailability, bookField, getAllJenisLapangan } = require('../controllers/BookingController.js');
// Route untuk login
router.post('/login', login);
router.put('/ubahPassword/:id', changePassword);
// Endpoint untuk update profil pengguna
router.put('/pengguna/:id', updateProfile);

// Endpoint untuk mengecek ketersediaan lapangan
router.post('/lapangan/available', checkAvailability);

// Endpoint untuk melakukan booking lapangan
router.post('/lapangan/book', bookField);
router.get('/lapangan/all', getAllJenisLapangan);

module.exports = router;
