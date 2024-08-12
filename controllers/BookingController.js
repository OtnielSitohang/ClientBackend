const db = require('../config');
const moment = require('moment-timezone');



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
    // Destructure data from request body
    const { pengguna_id, lapangan_id, jenis_lapangan_id, tanggal_booking, tanggal_penggunaan, sesi, foto_base64, harga, voucher_id } = req.body;

    // Insert booking with voucher_id
    const bookingQuery = `
      INSERT INTO booking (pengguna_id, lapangan_id, jenis_lapangan_id, tanggal_booking, tanggal_penggunaan, sesi, bukti_pembayaran, harga, status_konfirmasi, voucher_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `;

    // Set default value for voucher_id if not provided
    const bookingValues = [pengguna_id, lapangan_id, jenis_lapangan_id, tanggal_booking, tanggal_penggunaan, sesi, foto_base64, harga, voucher_id || null];

    await db.query(bookingQuery, bookingValues);

    res.status(201).json({ message: 'Booking created successfully' });
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

// Fungsi untuk memeriksa kode voucher
exports.checkVoucherCode = async (req, res) => {
  try {
    const { voucher_code } = req.body; // Mengambil kode voucher dari body request

    if (!voucher_code) {
      return res.status(400).json({ message: 'Voucher code is required' });
    }

    // Query untuk memeriksa voucher
    const query = `
      SELECT id, diskon 
      FROM voucher
      WHERE kode = ? 
        AND status = 1
        AND tanggal_mulai <= CURDATE()
        AND tanggal_selesai >= CURDATE()
    `;

    // Gunakan db.query untuk menjalankan query
    db.query(query, [voucher_code], (error, results) => {
      if (error) {
        console.error('Error fetching voucher:', error);
        return res.status(500).json({ message: 'Error fetching voucher' });
      }

      if (results.length > 0) {
        const voucher = results[0];
        res.status(200).json({
          valid: true,
          discount: voucher.diskon, // Misalnya diskon dalam persen
          id: voucher.id // Menambahkan ID voucher
        });
      } else {
        res.status(404).json({
          valid: false,
          message: 'Voucher not found or expired'
        });
      }
    });
  } catch (error) {
    console.error('Error checking voucher code:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};





// Fungsi untuk mengklaim voucher
exports.claimVoucher = async (req, res) => {
  try {
    const { pengguna_id, voucher_code } = req.body; // Mengambil pengguna_id dan kode voucher dari body request

    if (!voucher_code || !pengguna_id) {
      return res.status(400).json({ message: 'Voucher code and pengguna_id are required' });
    }

    // Query untuk memeriksa voucher
    const checkQuery = `
      SELECT id, diskon, batas_penggunaan
      FROM voucher
      WHERE kode = ? 
        AND status = 1
        AND tanggal_mulai <= CURDATE()
        AND tanggal_selesai >= CURDATE()
        AND batas_penggunaan > 0
    `;

    db.query(checkQuery, [voucher_code], (error, results) => {
      if (error) {
        console.error('Error fetching voucher:', error);
        return res.status(500).json({ message: 'Error fetching voucher' });
      }

      if (results.length > 0) {
        const voucher = results[0];

        // Cek apakah pengguna sudah menggunakan voucher ini
        const checkUsageQuery = `
          SELECT * FROM pengguna_voucher
          WHERE pengguna_id = ? 
            AND voucher_id = ?
        `;

        db.query(checkUsageQuery, [pengguna_id, voucher.id], (usageError, usageResults) => {
          if (usageError) {
            console.error('Error checking voucher usage:', usageError);
            return res.status(500).json({ message: 'Error checking voucher usage' });
          }

          if (usageResults.length > 0) {
            // Jika pengguna sudah menggunakan voucher ini
            return res.status(400).json({
              success: false,
              message: 'Voucher has already been claimed by this user'
            });
          }

          // Update batas penggunaan voucher
          const updateQuery = `
            UPDATE voucher
            SET batas_penggunaan = batas_penggunaan - 1
            WHERE kode = ?
          `;

          db.query(updateQuery, [voucher_code], (updateError) => {
            if (updateError) {
              console.error('Error updating voucher:', updateError);
              return res.status(500).json({ message: 'Error updating voucher' });
            }

            // Simpan entri ke pengguna_voucher
            const insertUsageQuery = `
              INSERT INTO pengguna_voucher (pengguna_id, voucher_id, tanggal_penggunaan)
              VALUES (?, ?, ?)
            `;

            // Mengambil tanggal saat ini dalam zona waktu GMT+7
            const currentDate = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');

            db.query(insertUsageQuery, [pengguna_id, voucher.id, currentDate], (insertError) => {
              if (insertError) {
                console.error('Error inserting voucher usage:', insertError);
                return res.status(500).json({ message: 'Error inserting voucher usage' });
              }

              res.status(200).json({
                success: true,
                message: 'Voucher successfully claimed',
                discount: voucher.diskon, // Misalnya diskon dalam bentuk angka, seperti Rp 30.000
                voucher_id: voucher.id // Menyertakan ID voucher dalam respons
              });
            });
          });
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Voucher not found, expired, or no usage left'
        });
      }
    });
  } catch (error) {
    console.error('Error claiming voucher:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
