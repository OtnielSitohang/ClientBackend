const db = require('../config'); 
const formatDate = date => date.toISOString().split('T')[0];


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

exports.getBookingsByUserId = (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const today = new Date();
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 7);

  // Format tanggal dalam format YYYY-MM-DD
  const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  const query = `
      SELECT
          b.tanggal_booking,
          b.tanggal_penggunaan,
          b.sesi,
          p.nama_lengkap AS nama_user,
          b.harga,
          CASE 
              WHEN b.status_konfirmasi = 1 THEN 'Confirmed'
              WHEN b.status_konfirmasi = 0 THEN 'Pending'
              ELSE 'Unknown' 
          END AS status_pembayaran,
          l.nama_lapangan,
          jl.nama AS jenis_lapangan
      FROM booking b
      JOIN pengguna p ON b.pengguna_id = p.id
      JOIN lapangan l ON b.lapangan_id = l.id
      JOIN jenis_lapangan jl ON l.jenis_lapangan_id = jl.id
      WHERE b.pengguna_id = ? AND b.tanggal_penggunaan BETWEEN ? AND ?
  `;

  db.query(query, [userId, formatDate(today), formatDate(sevenDaysLater)], (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Internal Server Error' });
      }

      res.json({
          message: 'Bookings retrieved successfully',
          data: results
      });
  });
};
