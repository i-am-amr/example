const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  type: {
    type: String,
    enum: ['whatsapp', 'sms', 'email'],
    default: 'whatsapp'
  },
  targetAudience: {
    cities: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'City'
    }],
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    registrationDateRange: {
      start: Date,
      end: Date
    },
    warrantyStatus: {
      type: String,
      enum: ['active', 'expired', 'expiring_soon', 'all'],
      default: 'all'
    }
  },
  filters: {
    excludeRecentContacts: {
      enabled: { type: Boolean, default: true },
      days: { type: Number, default: 7 }
    },
    excludeDuplicates: {
      enabled: { type: Boolean, default: true }
    },
    maxRecipients: {
      type: Number,
      default: 1000
    }
  },
  schedule: {
    scheduledAt: Date,
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    }
  },
  delivery: {
    batchSize: {
      type: Number,
      default: 10
    },
    delayBetweenBatches: {
      type: Number,
      default: 60000 // 1 minute in milliseconds
    },
    delayBetweenMessages: {
      type: Number,
      default: 2000 // 2 seconds in milliseconds
    }
  },
  statistics: {
    totalRecipients: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    read: { type: Number, default: 0 },
    replied: { type: Number, default: 0 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startedAt: Date,
  completedAt: Date,
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Index for better query performance
campaignSchema.index({ status: 1 });
campaignSchema.index({ type: 1 });
campaignSchema.index({ createdBy: 1 });
campaignSchema.index({ 'schedule.scheduledAt': 1 });

// Virtual for progress percentage
campaignSchema.virtual('progressPercentage').get(function() {
  if (this.statistics.totalRecipients === 0) return 0;
  return Math.round((this.statistics.sent / this.statistics.totalRecipients) * 100);
});

// Virtual for delivery rate
campaignSchema.virtual('deliveryRate').get(function() {
  if (this.statistics.sent === 0) return 0;
  return Math.round((this.statistics.delivered / this.statistics.sent) * 100);
});

// Virtual for read rate
campaignSchema.virtual('readRate').get(function() {
  if (this.statistics.delivered === 0) return 0;
  return Math.round((this.statistics.read / this.statistics.delivered) * 100);
});

// Method to check if campaign can be started
campaignSchema.methods.canBeStarted = function() {
  return this.status === 'draft' || this.status === 'scheduled';
};

// Method to check if campaign is running
campaignSchema.methods.isRunning = function() {
  return this.status === 'running';
};

// Method to check if campaign is completed
campaignSchema.methods.isCompleted = function() {
  return this.status === 'completed';
};

// Method to update statistics
campaignSchema.methods.updateStatistics = function(updates) {
  Object.keys(updates).forEach(key => {
    if (this.statistics.hasOwnProperty(key)) {
      this.statistics[key] += updates[key];
    }
  });
  return this.save();
};

// Ensure virtual fields are serialized
campaignSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Campaign', campaignSchema);