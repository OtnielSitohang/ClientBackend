const Pengguna = require('../models/Pengguna');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secretKey = 'your_secret_key'; // Ganti dengan secret key yang lebih kompleks untuk produksi

// Controller untuk login pengguna
const login = (req, res) => {
  const { username, password } = req.body;
  console.log("Route Login")

  Pengguna.findByUsername(username, (err, pengguna) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (!pengguna) {
      return res.status(404).json({ message: 'User not found' });
    }

    pengguna.verifyPassword(password, (err, result) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (!result) {
        return res.status(401).json({ message: 'Authentication failed' });
      }

      // Ensure that pengguna data is valid before constructing response
      if (!pengguna.username || !pengguna.nama_lengkap || !pengguna.foto_base64 || !pengguna.tanggal_lahir || !pengguna.email || !pengguna.tempat_tinggal || !pengguna.role) {
        console.error('Invalid pengguna data retrieved from database');
        return res.status(500).json({ message: 'Invalid user data' });
      }

      const token = pengguna.generateJwtToken(secretKey, '1h');
      res.json({
        message: 'Anda berhasil login',
        token: token,
        data: {
          id: pengguna.id,
          username: pengguna.username,
          nama_lengkap: pengguna.nama_lengkap,
          foto_base64: pengguna.foto_base64,
          tanggal_lahir: pengguna.tanggal_lahir,
          email: pengguna.email,
          tempat_tinggal: pengguna.tempat_tinggal,
          role: pengguna.role
        }
      });
    });
  });
};

// Controller untuk mengubah password pengguna
const changePassword = (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { id } = req.params;

  // Find the user by id
  Pengguna.findById(id, (err, user) => {
    if (err) {
      console.error('Error finding user:', err);
      return res.status(500).json({ message: 'Failed to find user' });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Call ubahPassword method on user instance
    user.ubahPassword(oldPassword, newPassword, (err) => {
      if (err) {
        console.error('Error changing password:', err);
        return res.status(400).json({ message: err.message });
      }

      // Password changed successfully
      res.json({ message: 'Password changed successfully' });
    });
  });
};

module.exports = {
  login,
  changePassword
};
