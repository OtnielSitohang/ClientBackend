const express = require('express');
const cors = require('cors'); // Import CORS middleware
const authRoutes = require('./route/auth'); // Import route untuk autentikasi
const config = require('./config'); // Konfigurasi koneksi database
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "192.168.182.83"

// Middleware untuk menangani JSON dan URL-encoded data
app.use(express.json({ limit: '100mb' }));
// Middleware CORS
app.use(cors());


app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Menggunakan rute untuk autentikasi
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Server is up and running!');
});
// Jalankan server
app.listen(PORT, HOST, () => {
  console.log(`Server is running on ${HOST}:${PORT}`);
});
