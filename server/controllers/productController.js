const Product = require('../models/Product');
const City = require('../models/City');
const Label = require('../models/Label');
const Registration = require('../models/Registration');
const QRCode = require('qrcode');
const { validationResult } = require('express-validator');

// Generate unique QR code data
const generateQRCodeData = (productId, sku) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${productId}-${sku}-${timestamp}-${random}`;
};

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Apply filters
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { sku: { $regex: req.query.search, $options: 'i' } },
        { brand: { $regex: req.query.search, $options: 'i' } },
        { category: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.brand) {
      filter.brand = req.query.brand;
    }
    
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    if (req.query.city) {
      filter.cities = req.query.city;
    }

    const products = await Product.find(filter)
      .populate('createdBy', 'firstName lastName username')
      .populate('cities', 'name code')
      .populate('labels', 'name color')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'firstName lastName username')
      .populate('cities', 'name code')
      .populate('labels', 'name color');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get registration count for this product
    const registrationCount = await Registration.countDocuments({ product: product._id });

    res.json({
      product,
      registrationCount
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin/Superadmin)
const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      sku,
      description,
      warrantyPeriod,
      warrantyTerms,
      price,
      category,
      brand,
      model,
      serialNumber,
      cities,
      labels,
      metadata
    } = req.body;

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product with this SKU already exists' });
    }

    // Generate QR code data
    const qrCodeData = generateQRCodeData('temp', sku);
    
    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Create product
    const product = new Product({
      name,
      sku,
      description,
      warrantyPeriod,
      warrantyTerms,
      price,
      category,
      brand,
      model,
      serialNumber,
      qrCode: qrCodeData,
      qrCodeData,
      createdBy: req.user._id,
      cities: cities || [],
      labels: labels || [],
      metadata: metadata || {}
    });

    // Update QR code data with actual product ID
    product.qrCodeData = generateQRCodeData(product._id, sku);
    product.qrCode = await QRCode.toDataURL(product.qrCodeData, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    await product.save();

    // Populate the created product
    await product.populate([
      { path: 'createdBy', select: 'firstName lastName username' },
      { path: 'cities', select: 'name code' },
      { path: 'labels', select: 'name color' }
    ]);

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin/Superadmin)
const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const {
      name,
      sku,
      description,
      warrantyPeriod,
      warrantyTerms,
      price,
      category,
      brand,
      model,
      serialNumber,
      cities,
      labels,
      metadata,
      isActive
    } = req.body;

    // Check if SKU is being changed and if it already exists
    if (sku && sku !== product.sku) {
      const existingProduct = await Product.findOne({ sku, _id: { $ne: product._id } });
      if (existingProduct) {
        return res.status(400).json({ message: 'Product with this SKU already exists' });
      }
    }

    // Update product fields
    if (name) product.name = name;
    if (sku) product.sku = sku;
    if (description !== undefined) product.description = description;
    if (warrantyPeriod) product.warrantyPeriod = warrantyPeriod;
    if (warrantyTerms) product.warrantyTerms = warrantyTerms;
    if (price !== undefined) product.price = price;
    if (category) product.category = category;
    if (brand) product.brand = brand;
    if (model) product.model = model;
    if (serialNumber) product.serialNumber = serialNumber;
    if (cities) product.cities = cities;
    if (labels) product.labels = labels;
    if (metadata) product.metadata = metadata;
    if (isActive !== undefined) product.isActive = isActive;

    // If SKU changed, regenerate QR code
    if (sku && sku !== product.sku) {
      product.qrCodeData = generateQRCodeData(product._id, sku);
      product.qrCode = await QRCode.toDataURL(product.qrCodeData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }

    await product.save();

    // Populate the updated product
    await product.populate([
      { path: 'createdBy', select: 'firstName lastName username' },
      { path: 'cities', select: 'name code' },
      { path: 'labels', select: 'name color' }
    ]);

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Superadmin only)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product has registrations
    const registrationCount = await Registration.countDocuments({ product: product._id });
    if (registrationCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete product with existing registrations',
        registrationCount
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get product statistics
// @route   GET /api/products/:id/stats
// @access  Private
const getProductStats = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const stats = await Registration.aggregate([
      { $match: { product: product._id } },
      {
        $group: {
          _id: null,
          totalRegistrations: { $sum: 1 },
          activeWarranties: {
            $sum: {
              $cond: [
                { $and: [
                  { $lte: ['$warrantyStartDate', new Date()] },
                  { $gte: ['$warrantyEndDate', new Date()] }
                ]},
                1,
                0
              ]
            }
          },
          expiredWarranties: {
            $sum: {
              $cond: [
                { $lt: ['$warrantyEndDate', new Date()] },
                1,
                0
              ]
            }
          },
          verifiedRegistrations: {
            $sum: {
              $cond: ['$isVerified', 1, 0]
            }
          }
        }
      }
    ]);

    const cityStats = await Registration.aggregate([
      { $match: { product: product._id } },
      {
        $group: {
          _id: '$city',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'cities',
          localField: '_id',
          foreignField: '_id',
          as: 'city'
        }
      },
      { $unwind: '$city' },
      {
        $project: {
          cityName: '$city.name',
          count: 1
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      product: {
        id: product._id,
        name: product.name,
        sku: product.sku
      },
      statistics: stats[0] || {
        totalRegistrations: 0,
        activeWarranties: 0,
        expiredWarranties: 0,
        verifiedRegistrations: 0
      },
      cityStats
    });
  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Generate QR code for product
// @route   GET /api/products/:id/qr
// @access  Private
const generateProductQR = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const qrCodeImage = await QRCode.toDataURL(product.qrCodeData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({
      qrCode: qrCodeImage,
      qrCodeData: product.qrCodeData,
      product: {
        id: product._id,
        name: product.name,
        sku: product.sku
      }
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  generateProductQR
};