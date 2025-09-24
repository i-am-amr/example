const mongoose = require('mongoose');

const labelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#3B82F6', // Default blue color
    match: /^#[0-9A-F]{6}$/i
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Index for better query performance
labelSchema.index({ name: 1 });
labelSchema.index({ isActive: 1 });
labelSchema.index({ createdBy: 1 });

// Method to increment usage count
labelSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

// Method to decrement usage count
labelSchema.methods.decrementUsage = function() {
  if (this.usageCount > 0) {
    this.usageCount -= 1;
  }
  return this.save();
};

// Pre-save middleware to ensure color format
labelSchema.pre('save', function(next) {
  if (this.color && !/^#[0-9A-F]{6}$/i.test(this.color)) {
    this.color = '#3B82F6'; // Default blue color
  }
  next();
});

module.exports = mongoose.model('Label', labelSchema);