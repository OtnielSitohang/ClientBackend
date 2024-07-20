const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config'); // Sesuaikan dengan konfigurasi database Anda

class Pengguna {
  constructor(username, password, nama_lengkap, foto_base64, tanggal_lahir, email, tempat_tinggal, role) {
    this.username = username;
    this.password = password;
    this.nama_lengkap = nama_lengkap;
    this.foto_base64 = foto_base64;
    this.tanggal_lahir = tanggal_lahir;
    this.email = email;
    this.tempat_tinggal = tempat_tinggal;
    this.role = role;
  }

  static findByUsername(username, callback) {
    const query = 'SELECT * FROM pengguna WHERE username = ?';
    db.query(query, [username], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      if (results.length === 0) {
        return callback(null, null);
      }
      const { id, username, password, nama_lengkap, foto_base64, tanggal_lahir, email, tempat_tinggal, role } = results[0];
      const pengguna = new Pengguna(username, password, nama_lengkap, foto_base64, tanggal_lahir, email, tempat_tinggal, role);
      pengguna.id = id;
      callback(null, pengguna);
    });
  }

  static findById(id, callback) {
    const query = 'SELECT * FROM pengguna WHERE id = ?';
    db.query(query, [id], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      if (results.length === 0) {
        return callback(null, null);
      }
      const { username, password, nama_lengkap, foto_base64, tanggal_lahir, email, tempat_tinggal, role } = results[0];
      const pengguna = new Pengguna(username, password, nama_lengkap, foto_base64, tanggal_lahir, email, tempat_tinggal, role);
      pengguna.id = id;
      callback(null, pengguna);
    });
  }

  verifyPassword(password, callback) {
    bcrypt.compare(password, this.password, (err, result) => {
      if (err) {
        return callback(err, false);
      }
      callback(null, result);
    });
  }

  generateJwtToken(secretKey, expiresIn) {
    return jwt.sign({ userId: this.id, role: this.role }, secretKey, { expiresIn });
  }

  updateProfile(profileData, callback) {
    const { foto_base64, email, tanggal_lahir } = profileData;
    let updateFields = [];
    let updateValues = [];

    if (foto_base64) {
      updateFields.push('foto_base64 = ?');
      updateValues.push(foto_base64);
    }
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (tanggal_lahir) {
      updateFields.push('tanggal_lahir = ?');
      updateValues.push(tanggal_lahir);
    }

    if (updateFields.length === 0) {
      return callback(null, this); // No fields to update
    }

    updateValues.push(this.id); // Add id for WHERE clause
    const query = `UPDATE pengguna SET ${updateFields.join(', ')} WHERE id = ?`;

    db.query(query, updateValues, (err, result) => {
      if (err) {
        return callback(err, null);
      }
      if (result.affectedRows === 0) {
        return callback(new Error('User not found or no changes applied'), null);
      }
      
      // Update object properties
      if (foto_base64) {
        this.foto_base64 = foto_base64;
      }
      if (email) {
        this.email = email;
      }
      if (tanggal_lahir) {
        this.tanggal_lahir = tanggal_lahir;
      }

      callback(null, this);
    });
  }

  ubahPassword(oldPassword, newPassword, callback) {
    // Verify old password first
    this.verifyPassword(oldPassword, (err, isMatch) => {
      if (err) {
        return callback(err);
      }
      if (!isMatch) {
        return callback(new Error('Old password is incorrect'));
      }

      // Check if new password is the same as old password
      if (newPassword === oldPassword) {
        return callback(new Error('New password must be different from the old password'));
      }

      // Update password in the database
      const updateQuery = 'UPDATE pengguna SET password = ? WHERE id = ?';
      bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) {
          return callback(err);
        }
        db.query(updateQuery, [hashedPassword, this.id], (err, result) => {
          if (err) {
            return callback(err);
          }
          if (result.affectedRows === 0) {
            return callback(new Error('User not found or no changes applied'));
          }

          // Update object property
          this.password = newPassword; // Menggunakan plain text password
          callback(null);
        });
      });
    });
  }
}

module.exports = Pengguna;
