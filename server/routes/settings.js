const express = require('express');
const { body } = require('express-validator');
const { auth, requirePermission } = require('../middleware/auth');

const router = express.Router();

// In-memory settings store (in production, use a database)
let settings = {
  warrantyTerms: {
    defaultWarrantyPeriod: 12, // months
    terms: "This warranty covers manufacturing defects and material faults. It does not cover damage caused by misuse, accidents, or normal wear and tear.",
    exclusions: [
      "Damage caused by misuse or accidents",
      "Normal wear and tear",
      "Damage from exposure to extreme conditions",
      "Unauthorized modifications or repairs"
    ]
  },
  messageTemplates: {
    welcomeMessage: "Welcome! Your warranty has been successfully registered. Thank you for choosing our product.",
    warrantyExpiryReminder: "Your warranty for {productName} will expire on {expiryDate}. Please contact us for any service needs.",
    warrantyExpired: "Your warranty for {productName} has expired on {expiryDate}. Contact us for extended warranty options."
  },
  whatsappSettings: {
    enabled: false,
    apiUrl: "",
    apiToken: "",
    phoneNumberId: "",
    webhookUrl: "",
    defaultMessage: "Thank you for registering your warranty. We'll keep you updated about your warranty status."
  },
  systemSettings: {
    allowPublicRegistration: true,
    requirePhoneVerification: false,
    requireEmailVerification: false,
    maxRegistrationsPerPhone: 10,
    qrCodeSize: 200,
    defaultLanguage: "en"
  }
};

// @route   GET /api/settings
// @desc    Get all settings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/settings/:category
// @desc    Get settings by category
// @access  Private
router.get('/:category', auth, async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!settings[category]) {
      return res.status(404).json({ message: 'Settings category not found' });
    }

    res.json({ 
      category,
      settings: settings[category]
    });
  } catch (error) {
    console.error('Get settings category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/settings/:category
// @desc    Update settings by category
// @access  Private (Admin/Superadmin)
router.put('/:category', auth, requirePermission('canManageSettings'), [
  body('settings').isObject().withMessage('Settings must be an object')
], async (req, res) => {
  try {
    const { category } = req.params;
    const { settings: newSettings } = req.body;

    if (!settings[category]) {
      return res.status(404).json({ message: 'Settings category not found' });
    }

    // Update settings
    settings[category] = { ...settings[category], ...newSettings };

    res.json({
      message: 'Settings updated successfully',
      category,
      settings: settings[category]
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/settings/:category/reset
// @desc    Reset settings to default
// @access  Private (Superadmin only)
router.post('/:category/reset', auth, requirePermission('canManageSettings'), async (req, res) => {
  try {
    const { category } = req.params;

    // Reset to default values
    const defaultSettings = {
      warrantyTerms: {
        defaultWarrantyPeriod: 12,
        terms: "This warranty covers manufacturing defects and material faults. It does not cover damage caused by misuse, accidents, or normal wear and tear.",
        exclusions: [
          "Damage caused by misuse or accidents",
          "Normal wear and tear",
          "Damage from exposure to extreme conditions",
          "Unauthorized modifications or repairs"
        ]
      },
      messageTemplates: {
        welcomeMessage: "Welcome! Your warranty has been successfully registered. Thank you for choosing our product.",
        warrantyExpiryReminder: "Your warranty for {productName} will expire on {expiryDate}. Please contact us for any service needs.",
        warrantyExpired: "Your warranty for {productName} has expired on {expiryDate}. Contact us for extended warranty options."
      },
      whatsappSettings: {
        enabled: false,
        apiUrl: "",
        apiToken: "",
        phoneNumberId: "",
        webhookUrl: "",
        defaultMessage: "Thank you for registering your warranty. We'll keep you updated about your warranty status."
      },
      systemSettings: {
        allowPublicRegistration: true,
        requirePhoneVerification: false,
        requireEmailVerification: false,
        maxRegistrationsPerPhone: 10,
        qrCodeSize: 200,
        defaultLanguage: "en"
      }
    };

    if (!defaultSettings[category]) {
      return res.status(404).json({ message: 'Settings category not found' });
    }

    settings[category] = defaultSettings[category];

    res.json({
      message: 'Settings reset to default successfully',
      category,
      settings: settings[category]
    });
  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/settings/templates/preview
// @desc    Preview message template with sample data
// @access  Private
router.get('/templates/preview', auth, async (req, res) => {
  try {
    const { template, productName, expiryDate } = req.query;

    if (!template || !settings.messageTemplates[template]) {
      return res.status(400).json({ message: 'Invalid template name' });
    }

    let message = settings.messageTemplates[template];
    
    // Replace placeholders with sample data
    message = message.replace(/{productName}/g, productName || 'Sample Product');
    message = message.replace(/{expiryDate}/g, expiryDate || '2024-12-31');

    res.json({
      template,
      message,
      sampleData: {
        productName: productName || 'Sample Product',
        expiryDate: expiryDate || '2024-12-31'
      }
    });
  } catch (error) {
    console.error('Preview template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;