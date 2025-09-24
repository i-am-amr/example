const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'agent', 'marketer', 'viewer'],
    default: 'viewer'
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  permissions: {
    canCreateProducts: { type: Boolean, default: false },
    canEditProducts: { type: Boolean, default: false },
    canDeleteProducts: { type: Boolean, default: false },
    canViewRegistrations: { type: Boolean, default: true },
    canCreateCampaigns: { type: Boolean, default: false },
    canSendWhatsApp: { type: Boolean, default: false },
    canExportData: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canManageSettings: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get user permissions based on role
userSchema.methods.getPermissions = function() {
  const rolePermissions = {
    superadmin: {
      canCreateProducts: true,
      canEditProducts: true,
      canDeleteProducts: true,
      canViewRegistrations: true,
      canCreateCampaigns: true,
      canSendWhatsApp: true,
      canExportData: true,
      canManageUsers: true,
      canManageSettings: true
    },
    admin: {
      canCreateProducts: true,
      canEditProducts: true,
      canDeleteProducts: true,
      canViewRegistrations: true,
      canCreateCampaigns: true,
      canSendWhatsApp: true,
      canExportData: true,
      canManageUsers: false,
      canManageSettings: false
    },
    agent: {
      canCreateProducts: false,
      canEditProducts: false,
      canDeleteProducts: false,
      canViewRegistrations: true,
      canCreateCampaigns: false,
      canSendWhatsApp: false,
      canExportData: false,
      canManageUsers: false,
      canManageSettings: false
    },
    marketer: {
      canCreateProducts: false,
      canEditProducts: false,
      canDeleteProducts: false,
      canViewRegistrations: true,
      canCreateCampaigns: true,
      canSendWhatsApp: true,
      canExportData: true,
      canManageUsers: false,
      canManageSettings: false
    },
    viewer: {
      canCreateProducts: false,
      canEditProducts: false,
      canDeleteProducts: false,
      canViewRegistrations: true,
      canCreateCampaigns: false,
      canSendWhatsApp: false,
      canExportData: false,
      canManageUsers: false,
      canManageSettings: false
    }
  };

  return rolePermissions[this.role] || rolePermissions.viewer;
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);