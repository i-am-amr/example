const express = require('express');
const { body, param } = require('express-validator');
const Label = require('../models/Label');
const { auth, requirePermission } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/labels
// @desc    Get all labels
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const labels = await Label.find({ isActive: true })
      .populate('createdBy', 'firstName lastName username')
      .sort({ name: 1 });

    res.json({ labels });
  } catch (error) {
    console.error('Get labels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/labels/:id
// @desc    Get single label
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const label = await Label.findById(req.params.id)
      .populate('createdBy', 'firstName lastName username');

    if (!label) {
      return res.status(404).json({ message: 'Label not found' });
    }

    res.json({ label });
  } catch (error) {
    console.error('Get label error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/labels
// @desc    Create new label
// @access  Private (Admin/Superadmin)
router.post('/', auth, requirePermission('canCreateProducts'), [
  body('name').notEmpty().withMessage('Label name is required')
], async (req, res) => {
  try {
    const { name, description, color } = req.body;

    const label = new Label({
      name,
      description,
      color,
      createdBy: req.user._id
    });

    await label.save();

    res.status(201).json({
      message: 'Label created successfully',
      label
    });
  } catch (error) {
    console.error('Create label error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/labels/:id
// @desc    Update label
// @access  Private (Admin/Superadmin)
router.put('/:id', auth, requirePermission('canEditProducts'), [
  param('id').isMongoId().withMessage('Invalid label ID')
], async (req, res) => {
  try {
    const label = await Label.findById(req.params.id);
    if (!label) {
      return res.status(404).json({ message: 'Label not found' });
    }

    const { name, description, color, isActive } = req.body;

    if (name) label.name = name;
    if (description !== undefined) label.description = description;
    if (color) label.color = color;
    if (isActive !== undefined) label.isActive = isActive;

    await label.save();

    res.json({
      message: 'Label updated successfully',
      label
    });
  } catch (error) {
    console.error('Update label error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/labels/:id
// @desc    Delete label
// @access  Private (Superadmin only)
router.delete('/:id', auth, requirePermission('canDeleteProducts'), [
  param('id').isMongoId().withMessage('Invalid label ID')
], async (req, res) => {
  try {
    const label = await Label.findById(req.params.id);
    if (!label) {
      return res.status(404).json({ message: 'Label not found' });
    }

    // Check if label is being used
    const Product = require('../models/Product');
    const Registration = require('../models/Registration');
    
    const productCount = await Product.countDocuments({ labels: label._id });
    const registrationCount = await Registration.countDocuments({ labels: label._id });

    if (productCount > 0 || registrationCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete label that is being used',
        productCount,
        registrationCount
      });
    }

    await Label.findByIdAndDelete(req.params.id);

    res.json({ message: 'Label deleted successfully' });
  } catch (error) {
    console.error('Delete label error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;