const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Daftar pengguna baru
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    // Periksa jika pengguna sudah wujud
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Cipta pengguna baru
    const newUser = new User({
      username,
      password,
      role: role || 'user'
    });
    
    await newUser.save();
    
    // Jana token JWT
    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET || 'realscan-premium-secret',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log masuk pengguna
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Cari pengguna
    const user = await User.findOne({ username, isActive: true });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Bandingkan password
    const isPasswordValid = await user.correctPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Kemas kini last login
    user.lastLogin = new Date();
    await user.save();
    
    // Jana token JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'realscan-premium-secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
