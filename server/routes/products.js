const express = require('express');
const { body, param } = require('express-validator');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  generateProductQR
} = require('../controllers/productController');
const { auth, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const createProductValidation = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('sku').notEmpty().withMessage('SKU is required'),
  body('warrantyPeriod').isInt({ min: 1 }).withMessage('Warranty period must be at least 1 month'),
  body('warrantyTerms').notEmpty().withMessage('Warranty terms are required')
];

const updateProductValidation = [
  param('id').isMongoId().withMessage('Invalid product ID'),
  body('warrantyPeriod').optional().isInt({ min: 1 }).withMessage('Warranty period must be at least 1 month')
];

const productIdValidation = [
  param('id').isMongoId().withMessage('Invalid product ID')
];

// @route   GET /api/products
// @desc    Get all products
// @access  Private
router.get('/', auth, getProducts);

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Private
router.get('/:id', auth, productIdValidation, getProduct);

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin/Superadmin)
router.post('/', auth, requirePermission('canCreateProducts'), createProductValidation, createProduct);

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin/Superadmin)
router.put('/:id', auth, requirePermission('canEditProducts'), updateProductValidation, updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Superadmin only)
router.delete('/:id', auth, requirePermission('canDeleteProducts'), productIdValidation, deleteProduct);

// @route   GET /api/products/:id/stats
// @desc    Get product statistics
// @access  Private
router.get('/:id/stats', auth, productIdValidation, getProductStats);

// @route   GET /api/products/:id/qr
// @desc    Generate QR code for product
// @access  Private
router.get('/:id/qr', auth, productIdValidation, generateProductQR);

module.exports = router;