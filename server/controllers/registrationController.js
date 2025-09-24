const Registration = require('../models/Registration');
const Product = require('../models/Product');
const City = require('../models/City');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

// Generate unique registration code
const generateRegistrationCode = () => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `WR${timestamp}${random}`;
};

// @desc    Get all registrations
// @route   GET /api/registrations
// @access  Private
const getRegistrations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Apply filters
    if (req.query.search) {
      filter.$or = [
        { customerName: { $regex: req.query.search, $options: 'i' } },
        { customerPhone: { $regex: req.query.search, $options: 'i' } },
        { registrationCode: { $regex: req.query.search, $options: 'i' } },
        { invoiceNumber: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.isVerified !== undefined) {
      filter.isVerified = req.query.isVerified === 'true';
    }
    
    if (req.query.city) {
      filter.city = req.query.city;
    }
    
    if (req.query.product) {
      filter.product = req.query.product;
    }
    
    if (req.query.warrantyStatus) {
      const now = new Date();
      switch (req.query.warrantyStatus) {
        case 'active':
          filter.warrantyStartDate = { $lte: now };
          filter.warrantyEndDate = { $gte: now };
          break;
        case 'expired':
          filter.warrantyEndDate = { $lt: now };
          break;
        case 'not_started':
          filter.warrantyStartDate = { $gt: now };
          break;
      }
    }

    const registrations = await Registration.find(filter)
      .populate('product', 'name sku warrantyPeriod')
      .populate('city', 'name code')
      .populate('labels', 'name color')
      .populate('createdBy', 'firstName lastName username')
      .populate('verifiedBy', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Registration.countDocuments(filter);

    res.json({
      registrations,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single registration
// @route   GET /api/registrations/:id
// @access  Private
const getRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('product', 'name sku warrantyPeriod warrantyTerms')
      .populate('city', 'name code')
      .populate('labels', 'name color')
      .populate('createdBy', 'firstName lastName username')
      .populate('verifiedBy', 'firstName lastName username');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.json({ registration });
  } catch (error) {
    console.error('Get registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new registration
// @route   POST /api/registrations
// @access  Private
const createRegistration = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      productId,
      customerName,
      customerPhone,
      customerEmail,
      cityId,
      invoiceNumber,
      invoiceDate,
      purchaseDate,
      customerAddress,
      additionalInfo,
      labels
    } = req.body;

    // Find product by QR code or ID
    let product;
    if (productId.startsWith('WR')) {
      // This is a QR code data, find product by it
      product = await Product.findOne({ qrCodeData: productId });
    } else {
      // This is a product ID
      product = await Product.findById(productId);
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.isActive) {
      return res.status(400).json({ message: 'Product is not active' });
    }

    // Check if product is already registered
    const existingRegistration = await Registration.findOne({
      product: product._id,
      customerPhone
    });

    if (existingRegistration) {
      return res.status(400).json({ 
        message: 'This product is already registered with this phone number',
        existingRegistration: {
          id: existingRegistration._id,
          registrationCode: existingRegistration.registrationCode,
          registrationDate: existingRegistration.registrationDate
        }
      });
    }

    // Verify city exists
    const city = await City.findById(cityId);
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }

    // Generate registration code
    const registrationCode = generateRegistrationCode();

    // Calculate warranty dates
    const warrantyStartDate = new Date(purchaseDate);
    const warrantyEndDate = new Date(purchaseDate);
    warrantyEndDate.setMonth(warrantyEndDate.getMonth() + product.warrantyPeriod);

    // Create registration
    const registration = new Registration({
      product: product._id,
      customerName,
      customerPhone,
      customerEmail,
      city: cityId,
      invoiceNumber,
      invoiceDate: new Date(invoiceDate),
      purchaseDate: new Date(purchaseDate),
      warrantyStartDate,
      warrantyEndDate,
      qrCode: product.qrCodeData,
      registrationCode,
      customerAddress,
      additionalInfo,
      labels: labels || [],
      createdBy: req.user ? req.user._id : null
    });

    await registration.save();

    // Populate the created registration
    await registration.populate([
      { path: 'product', select: 'name sku warrantyPeriod warrantyTerms' },
      { path: 'city', select: 'name code' },
      { path: 'labels', select: 'name color' }
    ]);

    res.status(201).json({
      message: 'Warranty registration successful',
      registration
    });
  } catch (error) {
    console.error('Create registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/registrations/verify
// @desc    Verify registration by QR code
// @access  Public
const verifyRegistration = async (req, res) => {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({ message: 'QR code is required' });
    }

    // Find product by QR code
    const product = await Product.findOne({ qrCodeData: qrCode });
    if (!product) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    if (!product.isActive) {
      return res.status(400).json({ message: 'Product is not active' });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({ qrCode })
      .populate('product', 'name sku warrantyPeriod')
      .populate('city', 'name code');

    if (existingRegistration) {
      return res.json({
        message: 'Product already registered',
        isRegistered: true,
        registration: existingRegistration
      });
    }

    res.json({
      message: 'Product found, ready for registration',
      isRegistered: false,
      product: {
        id: product._id,
        name: product.name,
        sku: product.sku,
        warrantyPeriod: product.warrantyPeriod,
        warrantyTerms: product.warrantyTerms
      }
    });
  } catch (error) {
    console.error('Verify registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update registration
// @route   PUT /api/registrations/:id
// @access  Private
const updateRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      cityId,
      invoiceNumber,
      invoiceDate,
      purchaseDate,
      customerAddress,
      additionalInfo,
      labels,
      notes,
      status
    } = req.body;

    if (customerName) registration.customerName = customerName;
    if (customerPhone) registration.customerPhone = customerPhone;
    if (customerEmail) registration.customerEmail = customerEmail;
    if (cityId) registration.city = cityId;
    if (invoiceNumber) registration.invoiceNumber = invoiceNumber;
    if (invoiceDate) registration.invoiceDate = new Date(invoiceDate);
    if (purchaseDate) {
      registration.purchaseDate = new Date(purchaseDate);
      // Recalculate warranty dates
      registration.warrantyStartDate = new Date(purchaseDate);
      registration.warrantyEndDate = new Date(purchaseDate);
      registration.warrantyEndDate.setMonth(registration.warrantyEndDate.getMonth() + registration.product.warrantyPeriod);
    }
    if (customerAddress) registration.customerAddress = customerAddress;
    if (additionalInfo) registration.additionalInfo = additionalInfo;
    if (labels) registration.labels = labels;
    if (notes) registration.notes = notes;
    if (status) registration.status = status;

    await registration.save();

    // Populate the updated registration
    await registration.populate([
      { path: 'product', select: 'name sku warrantyPeriod warrantyTerms' },
      { path: 'city', select: 'name code' },
      { path: 'labels', select: 'name color' },
      { path: 'createdBy', select: 'firstName lastName username' },
      { path: 'verifiedBy', select: 'firstName lastName username' }
    ]);

    res.json({
      message: 'Registration updated successfully',
      registration
    });
  } catch (error) {
    console.error('Update registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify registration
// @route   PUT /api/registrations/:id/verify
// @access  Private
const verifyRegistrationStatus = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const { isVerified, verificationMethod, notes } = req.body;

    registration.isVerified = isVerified;
    registration.verificationMethod = verificationMethod || 'manual';
    registration.verifiedAt = new Date();
    registration.verifiedBy = req.user._id;
    registration.status = isVerified ? 'verified' : 'rejected';
    if (notes) registration.notes = notes;

    await registration.save();

    // Populate the updated registration
    await registration.populate([
      { path: 'product', select: 'name sku warrantyPeriod warrantyTerms' },
      { path: 'city', select: 'name code' },
      { path: 'labels', select: 'name color' },
      { path: 'createdBy', select: 'firstName lastName username' },
      { path: 'verifiedBy', select: 'firstName lastName username' }
    ]);

    res.json({
      message: `Registration ${isVerified ? 'verified' : 'rejected'} successfully`,
      registration
    });
  } catch (error) {
    console.error('Verify registration status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get registration statistics
// @route   GET /api/registrations/stats
// @access  Private
const getRegistrationStats = async (req, res) => {
  try {
    const stats = await Registration.aggregate([
      {
        $group: {
          _id: null,
          totalRegistrations: { $sum: 1 },
          verifiedRegistrations: {
            $sum: { $cond: ['$isVerified', 1, 0] }
          },
          pendingRegistrations: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
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
          }
        }
      }
    ]);

    const cityStats = await Registration.aggregate([
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

    const monthlyStats = await Registration.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    res.json({
      statistics: stats[0] || {
        totalRegistrations: 0,
        verifiedRegistrations: 0,
        pendingRegistrations: 0,
        activeWarranties: 0,
        expiredWarranties: 0
      },
      cityStats,
      monthlyStats
    });
  } catch (error) {
    console.error('Get registration stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getRegistrations,
  getRegistration,
  createRegistration,
  verifyRegistration,
  updateRegistration,
  verifyRegistrationStatus,
  getRegistrationStats
};