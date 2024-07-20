const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./route/auth'); // Import route untuk autentikasi
const config = require('./config'); // Konfigurasi koneksi database

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware untuk parsing application/json
app.use(bodyParser.json());

// Menggunakan rute untuk autentikasi
app.use('/auth', authRoutes);

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
