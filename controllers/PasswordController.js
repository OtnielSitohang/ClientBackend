const Pengguna = require('../models/Pengguna');
const bcrypt = require('bcryptjs');
const db = require('../config'); 

// Controller untuk memeriksa username dan email
exports.checkUserByUsernameAndEmail = (req, res) => {
  const { username, email } = req.body;

  // Validasi input
  if (!username || !email) {
    return res.status(400).json({ message: 'Username dan email harus diisi' });
  }

  // Cari pengguna berdasarkan username dan email
  Pengguna.findByUsername(username, (err, pengguna) => {
    if (err) {
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }

    if (!pengguna || pengguna.email !== email) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan atau email tidak cocok' });
    }

    // Jika pengguna ditemukan dan email cocok
    return res.status(200).json({ message: 'Pengguna ditemukan', pengguna });
  });
};

// Controller untuk mengganti password
exports.resetPassword = (req, res) => {
  const { username, email, newPassword } = req.body;

  // Validasi input
  if (!username || !email || !newPassword) {
    return res.status(400).json({ message: 'Username, email, dan password baru harus diisi' });
  }

  // Cari pengguna berdasarkan username dan email
  Pengguna.findByUsername(username, (err, pengguna) => {
    if (err) {
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }

    if (!pengguna || pengguna.email !== email) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan atau email tidak cocok' });
    }

    // Hash password baru
    bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ message: 'Terjadi kesalahan dalam hashing password' });
      }

      // Update password di database
      const updateQuery = 'UPDATE pengguna SET password = ? WHERE id = ?';
      db.query(updateQuery, [hashedPassword, pengguna.id], (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Terjadi kesalahan dalam pembaruan password' });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Pengguna tidak ditemukan atau tidak ada perubahan' });
        }

        // Password berhasil diperbarui
        return res.status(200).json({ message: 'Password berhasil diperbarui' });
      });
    });
  });
};
