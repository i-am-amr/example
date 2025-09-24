const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    trim: true
  },
  invoiceDate: {
    type: Date,
    required: true
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  warrantyStartDate: {
    type: Date,
    required: true
  },
  warrantyEndDate: {
    type: Date,
    required: true
  },
  isWarrantyValid: {
    type: Boolean,
    default: true
  },
  qrCode: {
    type: String,
    required: true
  },
  registrationCode: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'expired'],
    default: 'pending'
  },
  verificationMethod: {
    type: String,
    enum: ['otp', 'email', 'manual', 'none'],
    default: 'none'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
  },
  customerAddress: {
    street: String,
    area: String,
    landmark: String,
    pincode: String
  },
  additionalInfo: {
    type: Map,
    of: String
  },
  labels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Label'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance
registrationSchema.index({ customerPhone: 1 });
registrationSchema.index({ registrationCode: 1 });
registrationSchema.index({ qrCode: 1 });
registrationSchema.index({ status: 1 });
registrationSchema.index({ warrantyEndDate: 1 });
registrationSchema.index({ city: 1 });
registrationSchema.index({ product: 1 });

// Virtual for warranty status
registrationSchema.virtual('warrantyStatus').get(function() {
  const now = new Date();
  if (this.warrantyEndDate < now) {
    return 'expired';
  } else if (this.warrantyStartDate > now) {
    return 'not_started';
  } else {
    return 'active';
  }
});

// Virtual for days remaining
registrationSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const diffTime = this.warrantyEndDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Method to check if warranty is active
registrationSchema.methods.isWarrantyActive = function() {
  const now = new Date();
  return this.warrantyStartDate <= now && this.warrantyEndDate >= now;
};

// Method to get warranty progress percentage
registrationSchema.methods.getWarrantyProgress = function() {
  const now = new Date();
  const totalWarrantyDays = this.warrantyEndDate - this.warrantyStartDate;
  const elapsedDays = now - this.warrantyStartDate;
  
  if (elapsedDays <= 0) return 0;
  if (elapsedDays >= totalWarrantyDays) return 100;
  
  return Math.round((elapsedDays / totalWarrantyDays) * 100);
};

// Pre-save middleware to calculate warranty dates
registrationSchema.pre('save', function(next) {
  if (this.isModified('purchaseDate') || this.isModified('product')) {
    if (this.purchaseDate && this.product) {
      this.warrantyStartDate = new Date(this.purchaseDate);
      this.warrantyEndDate = new Date(this.purchaseDate);
      this.warrantyEndDate.setMonth(this.warrantyEndDate.getMonth() + this.product.warrantyPeriod);
    }
  }
  next();
});

// Ensure virtual fields are serialized
registrationSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Registration', registrationSchema);