const express = require('express');
const { body } = require('express-validator');
const Registration = require('../models/Registration');
const Product = require('../models/Product');
const City = require('../models/City');
const XLSX = require('xlsx');
const { auth, requirePermission } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/export/registrations
// @desc    Export registrations to Excel
// @access  Private
router.post('/registrations', auth, requirePermission('canExportData'), [
  body('filters').optional().isObject().withMessage('Filters must be an object'),
  body('format').optional().isIn(['xlsx', 'csv']).withMessage('Format must be xlsx or csv')
], async (req, res) => {
  try {
    const { filters = {}, format = 'xlsx' } = req.body;

    // Build query filter
    const queryFilter = {};
    
    if (filters.search) {
      queryFilter.$or = [
        { customerName: { $regex: filters.search, $options: 'i' } },
        { customerPhone: { $regex: filters.search, $options: 'i' } },
        { registrationCode: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    if (filters.status) {
      queryFilter.status = filters.status;
    }
    
    if (filters.city) {
      queryFilter.city = filters.city;
    }
    
    if (filters.product) {
      queryFilter.product = filters.product;
    }
    
    if (filters.dateRange) {
      if (filters.dateRange.start) {
        queryFilter.createdAt = { ...queryFilter.createdAt, $gte: new Date(filters.dateRange.start) };
      }
      if (filters.dateRange.end) {
        queryFilter.createdAt = { ...queryFilter.createdAt, $lte: new Date(filters.dateRange.end) };
      }
    }

    // Get registrations with populated data
    const registrations = await Registration.find(queryFilter)
      .populate('product', 'name sku warrantyPeriod')
      .populate('city', 'name code')
      .populate('labels', 'name color')
      .sort({ createdAt: -1 });

    // Prepare data for export
    const exportData = registrations.map(reg => ({
      'Registration Code': reg.registrationCode,
      'Customer Name': reg.customerName,
      'Customer Phone': reg.customerPhone,
      'Customer Email': reg.customerEmail || '',
      'Product Name': reg.product?.name || '',
      'Product SKU': reg.product?.sku || '',
      'City': reg.city?.name || '',
      'Invoice Number': reg.invoiceNumber,
      'Invoice Date': reg.invoiceDate?.toISOString().split('T')[0] || '',
      'Purchase Date': reg.purchaseDate?.toISOString().split('T')[0] || '',
      'Warranty Start Date': reg.warrantyStartDate?.toISOString().split('T')[0] || '',
      'Warranty End Date': reg.warrantyEndDate?.toISOString().split('T')[0] || '',
      'Warranty Status': reg.warrantyStatus,
      'Days Remaining': reg.daysRemaining,
      'Is Verified': reg.isVerified ? 'Yes' : 'No',
      'Verification Method': reg.verificationMethod || '',
      'Status': reg.status,
      'Registration Date': reg.createdAt?.toISOString().split('T')[0] || '',
      'Labels': reg.labels?.map(label => label.name).join(', ') || '',
      'Notes': reg.notes || ''
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    const columnWidths = [
      { wch: 20 }, // Registration Code
      { wch: 25 }, // Customer Name
      { wch: 15 }, // Customer Phone
      { wch: 25 }, // Customer Email
      { wch: 30 }, // Product Name
      { wch: 15 }, // Product SKU
      { wch: 20 }, // City
      { wch: 20 }, // Invoice Number
      { wch: 12 }, // Invoice Date
      { wch: 12 }, // Purchase Date
      { wch: 15 }, // Warranty Start Date
      { wch: 15 }, // Warranty End Date
      { wch: 15 }, // Warranty Status
      { wch: 12 }, // Days Remaining
      { wch: 10 }, // Is Verified
      { wch: 15 }, // Verification Method
      { wch: 10 }, // Status
      { wch: 15 }, // Registration Date
      { wch: 30 }, // Labels
      { wch: 50 }  // Notes
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: format });

    // Set response headers
    const filename = `registrations_export_${new Date().toISOString().split('T')[0]}.${format}`;
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(buffer);
  } catch (error) {
    console.error('Export registrations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/export/products
// @desc    Export products to Excel
// @access  Private
router.post('/products', auth, requirePermission('canExportData'), [
  body('filters').optional().isObject().withMessage('Filters must be an object'),
  body('format').optional().isIn(['xlsx', 'csv']).withMessage('Format must be xlsx or csv')
], async (req, res) => {
  try {
    const { filters = {}, format = 'xlsx' } = req.body;

    // Build query filter
    const queryFilter = {};
    
    if (filters.search) {
      queryFilter.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { sku: { $regex: filters.search, $options: 'i' } },
        { brand: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    if (filters.category) {
      queryFilter.category = filters.category;
    }
    
    if (filters.brand) {
      queryFilter.brand = filters.brand;
    }
    
    if (filters.isActive !== undefined) {
      queryFilter.isActive = filters.isActive;
    }

    // Get products with populated data
    const products = await Product.find(queryFilter)
      .populate('createdBy', 'firstName lastName username')
      .populate('cities', 'name code')
      .populate('labels', 'name color')
      .sort({ createdAt: -1 });

    // Prepare data for export
    const exportData = products.map(product => ({
      'Product Name': product.name,
      'SKU': product.sku,
      'Description': product.description || '',
      'Brand': product.brand || '',
      'Category': product.category || '',
      'Model': product.model || '',
      'Warranty Period (Months)': product.warrantyPeriod,
      'Price': product.price || 0,
      'Cities': product.cities?.map(city => city.name).join(', ') || '',
      'Labels': product.labels?.map(label => label.name).join(', ') || '',
      'Is Active': product.isActive ? 'Yes' : 'No',
      'Created By': product.createdBy ? `${product.createdBy.firstName} ${product.createdBy.lastName}` : '',
      'Created Date': product.createdAt?.toISOString().split('T')[0] || '',
      'QR Code Data': product.qrCodeData
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    const columnWidths = [
      { wch: 30 }, // Product Name
      { wch: 15 }, // SKU
      { wch: 50 }, // Description
      { wch: 20 }, // Brand
      { wch: 20 }, // Category
      { wch: 20 }, // Model
      { wch: 20 }, // Warranty Period
      { wch: 10 }, // Price
      { wch: 30 }, // Cities
      { wch: 30 }, // Labels
      { wch: 10 }, // Is Active
      { wch: 25 }, // Created By
      { wch: 12 }, // Created Date
      { wch: 50 }  // QR Code Data
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: format });

    // Set response headers
    const filename = `products_export_${new Date().toISOString().split('T')[0]}.${format}`;
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(buffer);
  } catch (error) {
    console.error('Export products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/export/template/registrations
// @desc    Download registration import template
// @access  Private
router.get('/template/registrations', auth, requirePermission('canExportData'), async (req, res) => {
  try {
    // Create template data
    const templateData = [{
      'Product SKU': 'PROD001',
      'Customer Name': 'John Doe',
      'Customer Phone': '+1234567890',
      'Customer Email': 'john@example.com',
      'City Code': 'NYC',
      'Invoice Number': 'INV001',
      'Invoice Date': '2024-01-15',
      'Purchase Date': '2024-01-15',
      'Customer Address': '123 Main St, New York, NY 10001',
      'Notes': 'Optional notes'
    }];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Product SKU
      { wch: 25 }, // Customer Name
      { wch: 15 }, // Customer Phone
      { wch: 25 }, // Customer Email
      { wch: 12 }, // City Code
      { wch: 15 }, // Invoice Number
      { wch: 12 }, // Invoice Date
      { wch: 12 }, // Purchase Date
      { wch: 40 }, // Customer Address
      { wch: 30 }  // Notes
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="registration_import_template.xlsx"');

    res.send(buffer);
  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;