const db = require('../config'); // Import konfigurasi koneksi database

// Fungsi untuk mengambil semua jenis lapangan
exports.getAllJenisLapangan = async (req, res) => {
  try {
    const query = `
      SELECT id, nama, gambar
      FROM jenis_lapangan
    `;
    db.query(query, (error, results) => {
      if (error) {
        console.error('Error fetching jenis lapangan:', error);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
      res.status(200).json(results);
    });
  } catch (error) {
    console.error('Error fetching jenis lapangan:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



// controllers/BookingController.js

// controllers/BookingController.js

exports.checkAvailability = async (req, res) => {
  try {
    const { jenis_lapangan_id, tanggal_penggunaan, sesi } = req.body;

    // Query untuk mengecek ketersediaan lapangan
    const query = `
      SELECT id, nama_lapangan, harga
      FROM lapangan
      WHERE jenis_lapangan_id = ? 
        AND id NOT IN (
          SELECT lapangan_id
          FROM booking
          WHERE jenis_lapangan_id = ?
            AND tanggal_penggunaan = ?
            AND sesi = ?
        )
    `;
    db.query(query, [jenis_lapangan_id, jenis_lapangan_id, tanggal_penggunaan, sesi], (error, results) => {
      if (error) {
        console.error('Error checking field availability:', error);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
      
      // Menyusun data lapangan yang tersedia dengan harga
      const lapanganAvailable = results.map(({ id, nama_lapangan, harga }) => ({
        id,
        nama_lapangan,
        harga
      }));
      
      res.status(200).json(lapanganAvailable);
    });
  } catch (error) {
    console.error('Error checking field availability:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

  


exports.bookField = async (req, res) => {
  try {
    const { pengguna_id, lapangan_id, jenis_lapangan_id, tanggal_booking, tanggal_penggunaan, sesi, foto_base64, harga } = req.body;

    // Query untuk melakukan booking dengan data yang diterima dari request body
    const query = `
      INSERT INTO booking (pengguna_id, lapangan_id, jenis_lapangan_id, tanggal_booking, tanggal_penggunaan, sesi, bukti_pembayaran, harga)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [pengguna_id, lapangan_id, jenis_lapangan_id, tanggal_booking, tanggal_penggunaan, sesi, foto_base64, harga];

    // Jalankan query dengan data yang diterima
    db.query(query, values, (error, results) => {
      if (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ message: 'Error creating booking' });
      } else {
        res.status(201).json({ message: 'Booking created successfully' });
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking' });
  }
};
