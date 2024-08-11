// routes/index.js
const express = require('express');
const router = express.Router();
const { login } = require('../controllers/AuthController'); 
const { register, updateProfile, changePassword } = require('../controllers/penggunaController');
const { checkAvailability, bookField, getAllJenisLapangan , getBookingsByUserId } = require('../controllers/BookingController');
const { checkUserByUsernameAndEmail, resetPassword } = require('../controllers/PasswordController');

// Route untuk login
router.post('/login', login);
router.post('/register', register);
router.put('/ubahPassword/:id', changePassword);
router.put('/pengguna/:id', updateProfile);

// Endpoint untuk mengecek ketersediaan lapangan
router.post('/lapangan/available', checkAvailability);

// Endpoint untuk melakukan booking lapangan
router.post('/lapangan/book', bookField);
router.get('/lapangan/all', getAllJenisLapangan);
router.get('/bookings/:userId', getBookingsByUserId);

router.post('/check-user', checkUserByUsernameAndEmail);
router.post('/change-password', resetPassword);

module.exports = router;
