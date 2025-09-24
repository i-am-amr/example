const express = require('express');
const { body, param } = require('express-validator');
const {
  getRegistrations,
  getRegistration,
  createRegistration,
  verifyRegistration,
  updateRegistration,
  verifyRegistrationStatus,
  getRegistrationStats
} = require('../controllers/registrationController');
const { auth, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const createRegistrationValidation = [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('customerName').notEmpty().withMessage('Customer name is required'),
  body('customerPhone').notEmpty().withMessage('Customer phone is required'),
  body('cityId').isMongoId().withMessage('Invalid city ID'),
  body('invoiceNumber').notEmpty().withMessage('Invoice number is required'),
  body('invoiceDate').isISO8601().withMessage('Invalid invoice date'),
  body('purchaseDate').isISO8601().withMessage('Invalid purchase date')
];

const updateRegistrationValidation = [
  param('id').isMongoId().withMessage('Invalid registration ID')
];

const verifyRegistrationValidation = [
  body('qrCode').notEmpty().withMessage('QR code is required')
];

// @route   GET /api/registrations
// @desc    Get all registrations
// @access  Private
router.get('/', auth, getRegistrations);

// @route   GET /api/registrations/stats
// @desc    Get registration statistics
// @access  Private
router.get('/stats', auth, getRegistrationStats);

// @route   GET /api/registrations/:id
// @desc    Get single registration
// @access  Private
router.get('/:id', auth, updateRegistrationValidation, getRegistration);

// @route   POST /api/registrations
// @desc    Create new registration
// @access  Private
router.post('/', auth, createRegistrationValidation, createRegistration);

// @route   POST /api/registrations/verify
// @desc    Verify registration by QR code
// @access  Public
router.post('/verify', verifyRegistrationValidation, verifyRegistration);

// @route   PUT /api/registrations/:id
// @desc    Update registration
// @access  Private
router.put('/:id', auth, updateRegistrationValidation, updateRegistration);

// @route   PUT /api/registrations/:id/verify
// @desc    Verify registration status
// @access  Private
router.put('/:id/verify', auth, requirePermission('canViewRegistrations'), [
  body('isVerified').isBoolean().withMessage('isVerified must be a boolean')
], verifyRegistrationStatus);

module.exports = router;