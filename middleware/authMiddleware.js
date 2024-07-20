const jwt = require('jsonwebtoken');
const secretKey = 'your_secret_key'; // Ganti dengan secret key yang sama dengan yang digunakan untuk signing token

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Authentication failed: Token missing' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.userData = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed: Invalid token' });
  }
};

module.exports = authMiddleware;
