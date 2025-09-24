const Campaign = require('../models/Campaign');
const SendLog = require('../models/SendLog');
const Registration = require('../models/Registration');
const whatsappService = require('../services/whatsappService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Private
const getCampaigns = async (req, res) => {
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
    logger.error('Get campaigns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single campaign
// @route   GET /api/campaigns/:id
// @access  Private
const getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('createdBy', 'firstName lastName username')
      .populate('targetAudience.cities', 'name code')
      .populate('targetAudience.products', 'name sku');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Get send logs for this campaign
    const sendLogs = await SendLog.find({ campaign: campaign._id })
      .populate('registration', 'customerName customerPhone')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ 
      campaign,
      recentLogs: sendLogs
    });
  } catch (error) {
    logger.error('Get campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new campaign
// @route   POST /api/campaigns
// @access  Private (Marketer/Admin/Superadmin)
const createCampaign = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
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

    logger.info('Campaign created', {
      campaignId: campaign._id,
      name: campaign.name,
      createdBy: req.user._id
    });

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign
    });
  } catch (error) {
    logger.error('Create campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update campaign
// @route   PUT /api/campaigns/:id
// @access  Private (Marketer/Admin/Superadmin)
const updateCampaign = async (req, res) => {
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

    logger.info('Campaign updated', {
      campaignId: campaign._id,
      name: campaign.name,
      updatedBy: req.user._id
    });

    res.json({
      message: 'Campaign updated successfully',
      campaign
    });
  } catch (error) {
    logger.error('Update campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Start campaign
// @route   POST /api/campaigns/:id/start
// @access  Private (Marketer/Admin/Superadmin)
const startCampaign = async (req, res) => {
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

    // Start sending messages in background
    processCampaignMessages(campaign._id);

    logger.info('Campaign started', {
      campaignId: campaign._id,
      name: campaign.name,
      totalRecipients: targetRegistrations.length,
      startedBy: req.user._id
    });

    res.json({
      message: 'Campaign started successfully',
      campaign,
      totalRecipients: targetRegistrations.length
    });
  } catch (error) {
    logger.error('Start campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Pause campaign
// @route   POST /api/campaigns/:id/pause
// @access  Private (Marketer/Admin/Superadmin)
const pauseCampaign = async (req, res) => {
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

    logger.info('Campaign paused', {
      campaignId: campaign._id,
      name: campaign.name,
      pausedBy: req.user._id
    });

    res.json({
      message: 'Campaign paused successfully',
      campaign
    });
  } catch (error) {
    logger.error('Pause campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Resume campaign
// @route   POST /api/campaigns/:id/resume
// @access  Private (Marketer/Admin/Superadmin)
const resumeCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status !== 'paused') {
      return res.status(400).json({ message: 'Campaign is not paused' });
    }

    campaign.status = 'running';
    await campaign.save();

    // Resume sending messages in background
    processCampaignMessages(campaign._id);

    logger.info('Campaign resumed', {
      campaignId: campaign._id,
      name: campaign.name,
      resumedBy: req.user._id
    });

    res.json({
      message: 'Campaign resumed successfully',
      campaign
    });
  } catch (error) {
    logger.error('Resume campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete campaign
// @route   DELETE /api/campaigns/:id
// @access  Private (Superadmin only)
const deleteCampaign = async (req, res) => {
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

    logger.info('Campaign deleted', {
      campaignId: campaign._id,
      name: campaign.name,
      deletedBy: req.user._id
    });

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    logger.error('Delete campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get campaign statistics
// @route   GET /api/campaigns/:id/stats
// @access  Private
const getCampaignStats = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const stats = await SendLog.aggregate([
      { $match: { campaign: campaign._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          sent: {
            $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
          },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          read: {
            $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] }
          },
          replied: {
            $sum: { $cond: [{ $eq: ['$status', 'replied'] }, 1, 0] }
          }
        }
      }
    ]);

    const hourlyStats = await SendLog.aggregate([
      { $match: { campaign: campaign._id } },
      {
        $group: {
          _id: {
            hour: { $hour: '$createdAt' },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.hour': 1 } }
    ]);

    res.json({
      campaign: {
        id: campaign._id,
        name: campaign.name,
        status: campaign.status
      },
      statistics: stats[0] || {
        total: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        read: 0,
        replied: 0
      },
      hourlyStats
    });
  } catch (error) {
    logger.error('Get campaign stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

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

// Background process to send campaign messages
const processCampaignMessages = async (campaignId) => {
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || !campaign.isRunning()) {
      return;
    }

    const batchSize = campaign.delivery.batchSize || 10;
    const delayBetweenBatches = campaign.delivery.delayBetweenBatches || 60000;
    const delayBetweenMessages = campaign.delivery.delayBetweenMessages || 2000;

    // Get pending send logs
    const pendingLogs = await SendLog.find({
      campaign: campaignId,
      status: 'pending'
    }).limit(batchSize);

    if (pendingLogs.length === 0) {
      // No more pending messages, mark campaign as completed
      campaign.status = 'completed';
      campaign.completedAt = new Date();
      await campaign.save();
      
      logger.info('Campaign completed', {
        campaignId: campaign._id,
        name: campaign.name
      });
      return;
    }

    // Process batch
    for (const sendLog of pendingLogs) {
      try {
        let result;
        
        if (campaign.type === 'whatsapp') {
          result = await whatsappService.sendMessage(
            sendLog.recipient.phone,
            sendLog.message.content
          );
        } else {
          // Handle other message types (SMS, email) here
          result = { success: false, error: 'Message type not implemented' };
        }

        if (result.success) {
          await sendLog.updateDeliveryStatus('sent', {
            messageId: result.messageId
          });
          
          await campaign.updateStatistics({ sent: 1 });
        } else {
          await sendLog.addAttempt('failed', result.error);
        }

        // Delay between messages
        if (delayBetweenMessages > 0) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenMessages));
        }

      } catch (error) {
        logger.error('Error sending message in campaign', {
          campaignId,
          sendLogId: sendLog._id,
          error: error.message
        });
        
        await sendLog.addAttempt('failed', error.message);
      }
    }

    // Schedule next batch
    setTimeout(() => {
      processCampaignMessages(campaignId);
    }, delayBetweenBatches);

  } catch (error) {
    logger.error('Error processing campaign messages', {
      campaignId,
      error: error.message
    });
  }
};

module.exports = {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  deleteCampaign,
  getCampaignStats
};