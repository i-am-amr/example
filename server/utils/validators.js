const { body, param, query, validationResult } = require('express-validator');

// Common validation rules
const commonValidators = {
  mongoId: (field) => param(field).isMongoId().withMessage(`Invalid ${field} ID`),
  email: (field) => body(field).isEmail().withMessage('Please provide a valid email'),
  phone: (field) => body(field).isMobilePhone().withMessage('Please provide a valid phone number'),
  required: (field, message) => body(field).notEmpty().withMessage(message || `${field} is required`),
  optional: (field) => body(field).optional(),
  string: (field, min = 1, max = 255) => body(field).isLength({ min, max }).withMessage(`${field} must be between ${min} and ${max} characters`),
  number: (field, min = 0) => body(field).isNumeric().withMessage(`${field} must be a number`).isFloat({ min }).withMessage(`${field} must be at least ${min}`),
  date: (field) => body(field).isISO8601().withMessage(`Invalid ${field} date format`),
  boolean: (field) => body(field).isBoolean().withMessage(`${field} must be a boolean`),
  array: (field) => body(field).isArray().withMessage(`${field} must be an array`),
  object: (field) => body(field).isObject().withMessage(`${field} must be an object`),
};

// Product validation rules
const productValidators = {
  create: [
    commonValidators.required('name', 'Product name is required'),
    commonValidators.required('sku', 'SKU is required'),
    commonValidators.string('sku', 1, 50),
    commonValidators.number('warrantyPeriod', 1),
    commonValidators.required('warrantyTerms', 'Warranty terms are required'),
    commonValidators.optional('description'),
    commonValidators.optional('price'),
    commonValidators.optional('category'),
    commonValidators.optional('brand'),
    commonValidators.optional('model'),
    commonValidators.optional('serialNumber'),
    commonValidators.optional('cities'),
    commonValidators.optional('labels'),
  ],
  update: [
    commonValidators.mongoId('id'),
    commonValidators.optional('name'),
    commonValidators.optional('sku'),
    commonValidators.optional('warrantyPeriod'),
    commonValidators.optional('warrantyTerms'),
    commonValidators.optional('description'),
    commonValidators.optional('price'),
    commonValidators.optional('category'),
    commonValidators.optional('brand'),
    commonValidators.optional('model'),
    commonValidators.optional('serialNumber'),
    commonValidators.optional('cities'),
    commonValidators.optional('labels'),
    commonValidators.optional('isActive'),
  ],
  get: [
    commonValidators.mongoId('id'),
  ],
  delete: [
    commonValidators.mongoId('id'),
  ],
};

// Registration validation rules
const registrationValidators = {
  create: [
    commonValidators.required('productId', 'Product ID is required'),
    commonValidators.required('customerName', 'Customer name is required'),
    commonValidators.string('customerName', 2, 100),
    commonValidators.required('customerPhone', 'Customer phone is required'),
    commonValidators.phone('customerPhone'),
    commonValidators.optional('customerEmail'),
    commonValidators.email('customerEmail'),
    commonValidators.required('cityId', 'City is required'),
    commonValidators.mongoId('cityId'),
    commonValidators.required('invoiceNumber', 'Invoice number is required'),
    commonValidators.string('invoiceNumber', 1, 50),
    commonValidators.required('invoiceDate', 'Invoice date is required'),
    commonValidators.date('invoiceDate'),
    commonValidators.required('purchaseDate', 'Purchase date is required'),
    commonValidators.date('purchaseDate'),
    commonValidators.optional('customerAddress'),
    commonValidators.optional('notes'),
    commonValidators.optional('labels'),
  ],
  update: [
    commonValidators.mongoId('id'),
    commonValidators.optional('customerName'),
    commonValidators.optional('customerPhone'),
    commonValidators.optional('customerEmail'),
    commonValidators.optional('cityId'),
    commonValidators.optional('invoiceNumber'),
    commonValidators.optional('invoiceDate'),
    commonValidators.optional('purchaseDate'),
    commonValidators.optional('customerAddress'),
    commonValidators.optional('notes'),
    commonValidators.optional('labels'),
    commonValidators.optional('status'),
  ],
  verify: [
    commonValidators.required('qrCode', 'QR code is required'),
    commonValidators.string('qrCode', 1, 100),
  ],
  verifyStatus: [
    commonValidators.mongoId('id'),
    commonValidators.required('isVerified', 'Verification status is required'),
    commonValidators.boolean('isVerified'),
    commonValidators.optional('verificationMethod'),
    commonValidators.optional('notes'),
  ],
};

// User validation rules
const userValidators = {
  create: [
    commonValidators.required('username', 'Username is required'),
    commonValidators.string('username', 3, 30),
    commonValidators.required('email', 'Email is required'),
    commonValidators.email('email'),
    commonValidators.required('password', 'Password is required'),
    commonValidators.string('password', 6, 255),
    commonValidators.required('firstName', 'First name is required'),
    commonValidators.string('firstName', 1, 50),
    commonValidators.required('lastName', 'Last name is required'),
    commonValidators.string('lastName', 1, 50),
    commonValidators.required('role', 'Role is required'),
    body('role').isIn(['superadmin', 'admin', 'agent', 'marketer', 'viewer']).withMessage('Invalid role'),
    commonValidators.optional('phone'),
    commonValidators.optional('city'),
  ],
  update: [
    commonValidators.mongoId('id'),
    commonValidators.optional('firstName'),
    commonValidators.optional('lastName'),
    commonValidators.optional('role'),
    commonValidators.optional('phone'),
    commonValidators.optional('city'),
    commonValidators.optional('isActive'),
    commonValidators.optional('permissions'),
  ],
  activate: [
    commonValidators.mongoId('id'),
    commonValidators.required('isActive', 'isActive is required'),
    commonValidators.boolean('isActive'),
  ],
};

// City validation rules
const cityValidators = {
  create: [
    commonValidators.required('name', 'City name is required'),
    commonValidators.string('name', 1, 100),
    commonValidators.required('code', 'City code is required'),
    commonValidators.string('code', 2, 10),
    commonValidators.optional('country'),
    commonValidators.optional('state'),
    commonValidators.optional('pincode'),
    commonValidators.optional('distributors'),
  ],
  update: [
    commonValidators.mongoId('id'),
    commonValidators.optional('name'),
    commonValidators.optional('code'),
    commonValidators.optional('country'),
    commonValidators.optional('state'),
    commonValidators.optional('pincode'),
    commonValidators.optional('distributors'),
    commonValidators.optional('isActive'),
  ],
};

// Label validation rules
const labelValidators = {
  create: [
    commonValidators.required('name', 'Label name is required'),
    commonValidators.string('name', 1, 50),
    commonValidators.optional('description'),
    commonValidators.optional('color'),
  ],
  update: [
    commonValidators.mongoId('id'),
    commonValidators.optional('name'),
    commonValidators.optional('description'),
    commonValidators.optional('color'),
    commonValidators.optional('isActive'),
  ],
};

// Campaign validation rules
const campaignValidators = {
  create: [
    commonValidators.required('name', 'Campaign name is required'),
    commonValidators.string('name', 1, 100),
    commonValidators.required('message', 'Campaign message is required'),
    commonValidators.string('message', 1, 1000),
    commonValidators.optional('description'),
    commonValidators.optional('type'),
    commonValidators.optional('targetAudience'),
    commonValidators.optional('filters'),
    commonValidators.optional('schedule'),
    commonValidators.optional('delivery'),
  ],
  update: [
    commonValidators.mongoId('id'),
    commonValidators.optional('name'),
    commonValidators.optional('description'),
    commonValidators.optional('message'),
    commonValidators.optional('type'),
    commonValidators.optional('targetAudience'),
    commonValidators.optional('filters'),
    commonValidators.optional('schedule'),
    commonValidators.optional('delivery'),
  ],
};

// Settings validation rules
const settingsValidators = {
  update: [
    commonValidators.required('settings', 'Settings object is required'),
    commonValidators.object('settings'),
  ],
};

// Export validation rules
const exportValidators = {
  registrations: [
    commonValidators.optional('filters'),
    commonValidators.optional('format'),
    body('format').optional().isIn(['xlsx', 'csv']).withMessage('Format must be xlsx or csv'),
  ],
  products: [
    commonValidators.optional('filters'),
    commonValidators.optional('format'),
    body('format').optional().isIn(['xlsx', 'csv']).withMessage('Format must be xlsx or csv'),
  ],
};

// Query validation rules
const queryValidators = {
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  search: [
    query('search').optional().isString().withMessage('Search must be a string'),
  ],
  filters: [
    query('status').optional().isString().withMessage('Status must be a string'),
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    query('category').optional().isString().withMessage('Category must be a string'),
    query('brand').optional().isString().withMessage('Brand must be a string'),
    query('city').optional().isMongoId().withMessage('City must be a valid ID'),
    query('product').optional().isMongoId().withMessage('Product must be a valid ID'),
    query('isVerified').optional().isBoolean().withMessage('isVerified must be a boolean'),
    query('warrantyStatus').optional().isIn(['active', 'expired', 'expiring_soon', 'all']).withMessage('Invalid warranty status'),
  ],
};

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  commonValidators,
  productValidators,
  registrationValidators,
  userValidators,
  cityValidators,
  labelValidators,
  campaignValidators,
  settingsValidators,
  exportValidators,
  queryValidators,
  handleValidationErrors,
};