const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    unique: true
  },
  country: {
    type: String,
    required: true,
    trim: true,
    default: 'India'
  },
  state: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  agents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  distributors: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    contact: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    }
  }],
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Index for better query performance
citySchema.index({ name: 1 });
citySchema.index({ code: 1 });
citySchema.index({ isActive: 1 });

// Virtual for full address
citySchema.virtual('fullAddress').get(function() {
  const parts = [this.name];
  if (this.state) parts.push(this.state);
  if (this.country) parts.push(this.country);
  if (this.pincode) parts.push(this.pincode);
  return parts.join(', ');
});

// Method to get active agents count
citySchema.methods.getActiveAgentsCount = function() {
  return this.agents ? this.agents.length : 0;
};

// Method to get distributors count
citySchema.methods.getDistributorsCount = function() {
  return this.distributors ? this.distributors.length : 0;
};

// Ensure virtual fields are serialized
citySchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('City', citySchema);