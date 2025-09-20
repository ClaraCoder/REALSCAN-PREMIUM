const mongoose = require('mongoose');

const gameResultSchema = new mongoose.Schema({
  name: String,
  rate: Number,
  volatility: String
});

const scanResultSchema = new mongoose.Schema({
  megaId: {
    type: String,
    required: true
  },
  results: [gameResultSchema],
  overallWinRate: Number,
  topGame: String,
  topGameRate: Number,
  bottomGame: String,
  bottomGameRate: Number,
  recommendation: String,
  successProbability: Number,
  accuracy: Number,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index untuk penelusuran yang lebih pantas
scanResultSchema.index({ megaId: 1 });
scanResultSchema.index({ timestamp: -1 });

module.exports = mongoose.model('ScanResult', scanResultSchema);
