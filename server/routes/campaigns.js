const express = require('express');
const { body, param } = require('express-validator');
const Campaign = require('../models/Campaign');
const SendLog = require('../models/SendLog');
const Registration = require('../models/Registration');
const { auth, requirePermission } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/campaigns
// @desc    Get all campaigns
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Apply filters
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.type) {
      filter.type = req.query.type;
    }

    const campaigns = await Campaign.find(filter)
      .populate('createdBy', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Campaign.countDocuments(filter);

    res.json({
      campaigns,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/campaigns/:id
// @desc    Get single campaign
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('createdBy', 'firstName lastName username')
      .populate('targetAudience.cities', 'name code')
      .populate('targetAudience.products', 'name sku');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json({ campaign });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/campaigns
// @desc    Create new campaign
// @access  Private (Marketer/Admin/Superadmin)
router.post('/', auth, requirePermission('canCreateCampaigns'), [
  body('name').notEmpty().withMessage('Campaign name is required'),
  body('message').notEmpty().withMessage('Campaign message is required')
], async (req, res) => {
  try {
    const {
      name,
      description,
      message,
      type,
      targetAudience,
      filters,
      schedule,
      delivery
    } = req.body;

    const campaign = new Campaign({
      name,
      description,
      message,
      type: type || 'whatsapp',
      targetAudience: targetAudience || {},
      filters: filters || {},
      schedule: schedule || {},
      delivery: delivery || {},
      createdBy: req.user._id
    });

    await campaign.save();

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/campaigns/:id
// @desc    Update campaign
// @access  Private (Marketer/Admin/Superadmin)
router.put('/:id', auth, requirePermission('canCreateCampaigns'), [
  param('id').isMongoId().withMessage('Invalid campaign ID')
], async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Don't allow editing running or completed campaigns
    if (campaign.status === 'running' || campaign.status === 'completed') {
      return res.status(400).json({ message: 'Cannot edit running or completed campaigns' });
    }

    const {
      name,
      description,
      message,
      type,
      targetAudience,
      filters,
      schedule,
      delivery
    } = req.body;

    if (name) campaign.name = name;
    if (description !== undefined) campaign.description = description;
    if (message) campaign.message = message;
    if (type) campaign.type = type;
    if (targetAudience) campaign.targetAudience = targetAudience;
    if (filters) campaign.filters = filters;
    if (schedule) campaign.schedule = schedule;
    if (delivery) campaign.delivery = delivery;

    await campaign.save();

    res.json({
      message: 'Campaign updated successfully',
      campaign
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/campaigns/:id/start
// @desc    Start campaign
// @access  Private (Marketer/Admin/Superadmin)
router.post('/:id/start', auth, requirePermission('canSendWhatsApp'), [
  param('id').isMongoId().withMessage('Invalid campaign ID')
], async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (!campaign.canBeStarted()) {
      return res.status(400).json({ message: 'Campaign cannot be started in current status' });
    }

    // Get target registrations
    const targetRegistrations = await getTargetRegistrations(campaign);
    
    if (targetRegistrations.length === 0) {
      return res.status(400).json({ message: 'No target registrations found for this campaign' });
    }

    // Update campaign status
    campaign.status = 'running';
    campaign.startedAt = new Date();
    campaign.statistics.totalRecipients = targetRegistrations.length;
    await campaign.save();

    // Create send logs for each registration
    const sendLogs = targetRegistrations.map(registration => ({
      campaign: campaign._id,
      registration: registration._id,
      recipient: {
        phone: registration.customerPhone,
        name: registration.customerName,
        city: registration.city
      },
      message: {
        content: campaign.message,
        type: campaign.type
      }
    }));

    await SendLog.insertMany(sendLogs);

    res.json({
      message: 'Campaign started successfully',
      campaign,
      totalRecipients: targetRegistrations.length
    });
  } catch (error) {
    console.error('Start campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/campaigns/:id/pause
// @desc    Pause campaign
// @access  Private (Marketer/Admin/Superadmin)
router.post('/:id/pause', auth, requirePermission('canSendWhatsApp'), [
  param('id').isMongoId().withMessage('Invalid campaign ID')
], async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (!campaign.isRunning()) {
      return res.status(400).json({ message: 'Campaign is not running' });
    }

    campaign.status = 'paused';
    await campaign.save();

    res.json({
      message: 'Campaign paused successfully',
      campaign
    });
  } catch (error) {
    console.error('Pause campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/campaigns/:id
// @desc    Delete campaign
// @access  Private (Superadmin only)
router.delete('/:id', auth, requirePermission('canCreateCampaigns'), [
  param('id').isMongoId().withMessage('Invalid campaign ID')
], async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Don't allow deleting running campaigns
    if (campaign.isRunning()) {
      return res.status(400).json({ message: 'Cannot delete running campaign' });
    }

    // Delete associated send logs
    await SendLog.deleteMany({ campaign: campaign._id });

    await Campaign.findByIdAndDelete(req.params.id);

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to get target registrations for campaign
const getTargetRegistrations = async (campaign) => {
  const filter = {};

  // Apply city filter
  if (campaign.targetAudience.cities && campaign.targetAudience.cities.length > 0) {
    filter.city = { $in: campaign.targetAudience.cities };
  }

  // Apply product filter
  if (campaign.targetAudience.products && campaign.targetAudience.products.length > 0) {
    filter.product = { $in: campaign.targetAudience.products };
  }

  // Apply registration date range filter
  if (campaign.targetAudience.registrationDateRange) {
    const { start, end } = campaign.targetAudience.registrationDateRange;
    if (start) filter.createdAt = { ...filter.createdAt, $gte: new Date(start) };
    if (end) filter.createdAt = { ...filter.createdAt, $lte: new Date(end) };
  }

  // Apply warranty status filter
  if (campaign.targetAudience.warrantyStatus && campaign.targetAudience.warrantyStatus !== 'all') {
    const now = new Date();
    switch (campaign.targetAudience.warrantyStatus) {
      case 'active':
        filter.warrantyStartDate = { $lte: now };
        filter.warrantyEndDate = { $gte: now };
        break;
      case 'expired':
        filter.warrantyEndDate = { $lt: now };
        break;
      case 'expiring_soon':
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        filter.warrantyEndDate = { $gte: now, $lte: thirtyDaysFromNow };
        break;
    }
  }

  // Apply exclude recent contacts filter
  if (campaign.filters.excludeRecentContacts && campaign.filters.excludeRecentContacts.enabled) {
    const days = campaign.filters.excludeRecentContacts.days || 7;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Get recent contacts from send logs
    const recentContacts = await SendLog.distinct('recipient.phone', {
      createdAt: { $gte: cutoffDate }
    });
    
    if (recentContacts.length > 0) {
      filter.customerPhone = { $nin: recentContacts };
    }
  }

  // Apply max recipients limit
  const limit = campaign.filters.maxRecipients || 1000;

  const registrations = await Registration.find(filter)
    .populate('city', 'name code')
    .populate('product', 'name sku')
    .limit(limit);

  return registrations;
};

module.exports = router;