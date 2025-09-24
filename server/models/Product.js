const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  },
  warrantyPeriod: {
    type: Number,
    required: true,
    min: 1 // months
  },
  warrantyTerms: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    min: 0
  },
  category: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  serialNumber: {
    type: String,
    trim: true
  },
  qrCode: {
    type: String,
    unique: true,
    required: true
  },
  qrCodeData: {
    type: String,
    required: true
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
  cities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City'
  }],
  labels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Label'
  }],
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Index for better query performance
productSchema.index({ sku: 1 });
productSchema.index({ qrCode: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ createdBy: 1 });

// Virtual for warranty period in days
productSchema.virtual('warrantyPeriodDays').get(function() {
  return this.warrantyPeriod * 30; // Approximate days
});

// Method to check if product is eligible for warranty
productSchema.methods.isEligibleForWarranty = function(registrationDate) {
  const now = new Date();
  const registration = new Date(registrationDate);
  const warrantyEndDate = new Date(registration);
  warrantyEndDate.setMonth(warrantyEndDate.getMonth() + this.warrantyPeriod);
  
  return now <= warrantyEndDate;
};

// Method to get warranty end date
productSchema.methods.getWarrantyEndDate = function(registrationDate) {
  const registration = new Date(registrationDate);
  const warrantyEndDate = new Date(registration);
  warrantyEndDate.setMonth(warrantyEndDate.getMonth() + this.warrantyPeriod);
  
  return warrantyEndDate;
};

// Ensure virtual fields are serialized
productSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Product', productSchema);