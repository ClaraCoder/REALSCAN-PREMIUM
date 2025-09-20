const mongoose = require('mongoose');

const accessCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  note: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    required: true
  },
  megaId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  usedCount: {
    type: Number,
    default: 0
  }
});

// Index untuk penelusuran yang lebih pantas
accessCodeSchema.index({ expiresAt: 1 });
accessCodeSchema.index({ active: 1 });

module.exports = mongoose.model('AccessCode', accessCodeSchema);
