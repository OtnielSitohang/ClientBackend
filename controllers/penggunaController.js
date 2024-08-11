const Pengguna = require('../models/Pengguna');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config'); // Import db from config

// Path to default.jpg in assets folder
const defaultImagePath = path.join(__dirname, '../assets/defaultFoto.jpg');

// Function to convert file to base64
function fileToBase64(filePath) {
  const fileData = fs.readFileSync(filePath);
  return Buffer.from(fileData).toString('base64');
}


exports.register = (req, res) => {
  const { username, password, nama_lengkap, tanggal_lahir, email, tempat_tinggal } = req.body;

  // Set default role as 'customer'
  const role = 'customer';

  // Convert defaultFoto.jpg to base64
  const foto_base64 = fileToBase64(defaultImagePath);

  // Hash password using bcrypt
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing password:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    // Create a new Pengguna instance with base64 foto
    const newPengguna = new Pengguna(username, hashedPassword, nama_lengkap, foto_base64, tanggal_lahir, email, tempat_tinggal, role);

    // Insert new pengguna into the database
    const insertQuery = 'INSERT INTO Pengguna (username, password, nama_lengkap, foto_base64, tanggal_lahir, email, tempat_tinggal, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [newPengguna.username, newPengguna.password, newPengguna.nama_lengkap, newPengguna.foto_base64, newPengguna.tanggal_lahir, newPengguna.email, newPengguna.tempat_tinggal, newPengguna.role];

    db.query(insertQuery, values, (err, result) => {
      if (err) {
        console.error('Error inserting new pengguna:', err);
        return res.status(500).json({ message: 'Failed to create new pengguna' });
      }

      res.status(201).json({
        message: 'New pengguna created successfully',
        data: {
          id: result.insertId,
          username: newPengguna.username,
          nama_lengkap: newPengguna.nama_lengkap,
          email: newPengguna.email,
          tempat_tinggal: newPengguna.tempat_tinggal,
          tanggal_lahir: newPengguna.tanggal_lahir,
          role: newPengguna.role,
          foto_base64: newPengguna.foto_base64
        }
      });
    });
  });
};

exports.updateProfile = (req, res) => {
  const { foto_base64, email, tempat_tinggal, tanggal_lahir } = req.body;
  const { id } = req.params;

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
  if (tempat_tinggal) {
    updateFields.push('tempat_tinggal = ?');
    updateValues.push(tempat_tinggal);
  }
  if (tanggal_lahir) {
    updateFields.push('tanggal_lahir = ?');
    updateValues.push(tanggal_lahir);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  updateValues.push(id);

  const updateQuery = `UPDATE Pengguna SET ${updateFields.join(', ')} WHERE id = ?`;

  db.query(updateQuery, updateValues, (err, result) => {
    if (err) {
      console.error('Error updating user profile:', err);
      return res.status(500).json({ message: 'Failed to update user profile' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found or no changes applied' });
    }

    const retrieveQuery = 'SELECT id, username, nama_lengkap, email, tempat_tinggal, tanggal_lahir, role, foto_base64 FROM Pengguna WHERE id = ?';
    db.query(retrieveQuery, [id], (err, rows) => {
      if (err) {
        console.error('Error retrieving updated user profile:', err);
        return res.status(500).json({ message: 'Failed to retrieve updated user profile' });
      }

      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const updatedUser = rows[0];
      res.json({
        message: 'User profile updated successfully',
        data: updatedUser
      });
    });
  });
};




exports.changePassword = (req, res) => {
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



