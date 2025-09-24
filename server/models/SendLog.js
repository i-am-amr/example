const mongoose = require('mongoose');

const sendLogSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  registration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true
  },
  recipient: {
    phone: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'City'
    }
  },
  message: {
    content: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['whatsapp', 'sms', 'email'],
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'read', 'replied'],
    default: 'pending'
  },
  deliveryDetails: {
    messageId: String,
    externalId: String,
    provider: String,
    cost: Number,
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
    failedAt: Date,
    failureReason: String
  },
  attempts: [{
    attemptedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['success', 'failed']
    },
    error: String,
    response: mongoose.Schema.Types.Mixed
  }],
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  nextRetryAt: Date,
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Index for better query performance
sendLogSchema.index({ campaign: 1 });
sendLogSchema.index({ registration: 1 });
sendLogSchema.index({ 'recipient.phone': 1 });
sendLogSchema.index({ status: 1 });
sendLogSchema.index({ 'deliveryDetails.sentAt': 1 });
sendLogSchema.index({ nextRetryAt: 1 });

// Virtual for is retryable
sendLogSchema.virtual('isRetryable').get(function() {
  return this.retryCount < this.maxRetries && this.status === 'failed';
});

// Virtual for time since last attempt
sendLogSchema.virtual('timeSinceLastAttempt').get(function() {
  if (this.attempts.length === 0) return null;
  const lastAttempt = this.attempts[this.attempts.length - 1];
  return Date.now() - lastAttempt.attemptedAt.getTime();
});

// Method to add attempt
sendLogSchema.methods.addAttempt = function(status, error = null, response = null) {
  this.attempts.push({
    attemptedAt: new Date(),
    status,
    error,
    response
  });
  
  if (status === 'failed') {
    this.retryCount += 1;
    if (this.retryCount < this.maxRetries) {
      // Schedule next retry (exponential backoff)
      const delay = Math.pow(2, this.retryCount) * 60000; // 2^n minutes
      this.nextRetryAt = new Date(Date.now() + delay);
    }
  } else {
    this.status = status;
    this.nextRetryAt = null;
  }
  
  return this.save();
};

// Method to update delivery status
sendLogSchema.methods.updateDeliveryStatus = function(status, details = {}) {
  this.status = status;
  
  if (status === 'sent') {
    this.deliveryDetails.sentAt = new Date();
  } else if (status === 'delivered') {
    this.deliveryDetails.deliveredAt = new Date();
  } else if (status === 'read') {
    this.deliveryDetails.readAt = new Date();
  } else if (status === 'failed') {
    this.deliveryDetails.failedAt = new Date();
    this.deliveryDetails.failureReason = details.failureReason || 'Unknown error';
  }
  
  // Update delivery details
  Object.keys(details).forEach(key => {
    if (key !== 'failureReason') {
      this.deliveryDetails[key] = details[key];
    }
  });
  
  return this.save();
};

// Method to check if message should be retried
sendLogSchema.methods.shouldRetry = function() {
  return this.isRetryable && 
         this.nextRetryAt && 
         new Date() >= this.nextRetryAt;
};

// Ensure virtual fields are serialized
sendLogSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('SendLog', sendLogSchema);