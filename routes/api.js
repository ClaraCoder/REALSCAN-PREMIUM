const express = require('express');
const router = express.Router();
const AccessCode = require('../models/AccessCode');
const ScanResult = require('../models/ScanResult');
const { v4: uuidv4 } = require('uuid');

// Dapatkan semua kod akses
router.get('/access-codes', async (req, res) => {
  try {
    const codes = await AccessCode.find().sort({ createdAt: -1 });
    res.json(codes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cipta kod akses baru
router.post('/access-codes', async (req, res) => {
  try {
    const { note, duration, megaId } = req.body;
    
    // Jana kod unik
    const code = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
    
    // Kira masa tamat
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + duration * 60000);
    
    // Cipta kod akses baru
    const newCode = new AccessCode({
      code,
      note,
      duration,
      megaId,
      createdAt,
      expiresAt
    });
    
    await newCode.save();
    res.json(newCode);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deactivate kod akses
router.delete('/access-codes/:id', async (req, res) => {
  try {
    const code = await AccessCode.findById(req.params.id);
    if (!code) {
      return res.status(404).json({ error: 'Access code not found' });
    }
    
    code.active = false;
    await code.save();
    
    res.json({ message: 'Access code deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dapatkan hasil scan
router.get('/scan-results', async (req, res) => {
  try {
    const { megaId, limit = 10, page = 1 } = req.query;
    
    let query = {};
    if (megaId) query.megaId = megaId;
    
    const results = await ScanResult.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await ScanResult.countDocuments(query);
    
    res.json({
      results,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dapatkan statistik
router.get('/stats', async (req, res) => {
  try {
    const totalCodes = await AccessCode.countDocuments();
    const activeCodes = await AccessCode.countDocuments({ active: true });
    const totalScans = await ScanResult.countDocuments();
    
    // Dapatkan scan terkini
    const recentScans = await ScanResult.find()
      .sort({ timestamp: -1 })
      .limit(5);
    
    res.json({
      totalCodes,
      activeCodes,
      totalScans,
      recentScans
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
