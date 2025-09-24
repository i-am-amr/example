const express = require('express');
const { body, param } = require('express-validator');
const City = require('../models/City');
const { auth, requirePermission } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/cities
// @desc    Get all cities
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const cities = await City.find({ isActive: true })
      .populate('agents', 'firstName lastName username')
      .sort({ name: 1 });

    res.json({ cities });
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/cities/:id
// @desc    Get single city
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const city = await City.findById(req.params.id)
      .populate('agents', 'firstName lastName username');

    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }

    res.json({ city });
  } catch (error) {
    console.error('Get city error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/cities
// @desc    Create new city
// @access  Private (Admin/Superadmin)
router.post('/', auth, requirePermission('canManageUsers'), [
  body('name').notEmpty().withMessage('City name is required'),
  body('code').notEmpty().withMessage('City code is required')
], async (req, res) => {
  try {
    const { name, code, country, state, pincode, distributors } = req.body;

    const city = new City({
      name,
      code,
      country,
      state,
      pincode,
      distributors: distributors || []
    });

    await city.save();

    res.status(201).json({
      message: 'City created successfully',
      city
    });
  } catch (error) {
    console.error('Create city error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/cities/:id
// @desc    Update city
// @access  Private (Admin/Superadmin)
router.put('/:id', auth, requirePermission('canManageUsers'), [
  param('id').isMongoId().withMessage('Invalid city ID')
], async (req, res) => {
  try {
    const city = await City.findById(req.params.id);
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }

    const { name, code, country, state, pincode, distributors, isActive } = req.body;

    if (name) city.name = name;
    if (code) city.code = code;
    if (country) city.country = country;
    if (state) city.state = state;
    if (pincode) city.pincode = pincode;
    if (distributors) city.distributors = distributors;
    if (isActive !== undefined) city.isActive = isActive;

    await city.save();

    res.json({
      message: 'City updated successfully',
      city
    });
  } catch (error) {
    console.error('Update city error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/cities/:id
// @desc    Delete city
// @access  Private (Superadmin only)
router.delete('/:id', auth, requirePermission('canManageUsers'), [
  param('id').isMongoId().withMessage('Invalid city ID')
], async (req, res) => {
  try {
    const city = await City.findById(req.params.id);
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }

    // Check if city has agents or registrations
    const User = require('../models/User');
    const Registration = require('../models/Registration');
    
    const agentCount = await User.countDocuments({ city: city._id });
    const registrationCount = await Registration.countDocuments({ city: city._id });

    if (agentCount > 0 || registrationCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete city with existing agents or registrations',
        agentCount,
        registrationCount
      });
    }

    await City.findByIdAndDelete(req.params.id);

    res.json({ message: 'City deleted successfully' });
  } catch (error) {
    console.error('Delete city error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;