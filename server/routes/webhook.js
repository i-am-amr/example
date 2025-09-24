const express = require('express');
const whatsappService = require('../services/whatsappService');
const SendLog = require('../models/SendLog');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/webhook/whatsapp
// @desc    WhatsApp webhook verification
// @access  Public
router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verify the webhook
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    logger.info('WhatsApp webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    logger.error('WhatsApp webhook verification failed', {
      mode,
      token: token ? 'provided' : 'missing',
      expectedToken: process.env.WHATSAPP_VERIFY_TOKEN ? 'set' : 'missing'
    });
    res.status(403).send('Forbidden');
  }
});

// @route   POST /api/webhook/whatsapp
// @desc    WhatsApp webhook for receiving messages and status updates
// @access  Public
router.post('/whatsapp', async (req, res) => {
  try {
    const webhookData = req.body;
    
    // Process webhook data
    const processedData = whatsappService.processWebhook(webhookData);
    
    // Handle each event
    for (const event of processedData) {
      if (event.type === 'status') {
        await handleMessageStatus(event);
      } else if (event.type === 'message') {
        await handleIncomingMessage(event);
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    logger.error('WhatsApp webhook processing error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Handle message status updates
const handleMessageStatus = async (statusEvent) => {
  try {
    const { messageId, status, timestamp, recipientId } = statusEvent;
    
    // Find the send log by message ID
    const sendLog = await SendLog.findOne({
      'deliveryDetails.messageId': messageId
    });
    
    if (!sendLog) {
      logger.warn('Send log not found for message status update', {
        messageId,
        status
      });
      return;
    }
    
    // Update send log status
    await sendLog.updateDeliveryStatus(status, {
      timestamp: new Date(parseInt(timestamp) * 1000)
    });
    
    // Update campaign statistics
    const campaign = await Campaign.findById(sendLog.campaign);
    if (campaign) {
      const statsUpdate = {};
      if (status === 'delivered') statsUpdate.delivered = 1;
      else if (status === 'read') statsUpdate.read = 1;
      else if (status === 'failed') statsUpdate.failed = 1;
      
      if (Object.keys(statsUpdate).length > 0) {
        await campaign.updateStatistics(statsUpdate);
      }
    }
    
    logger.info('Message status updated', {
      messageId,
      status,
      sendLogId: sendLog._id
    });
    
  } catch (error) {
    logger.error('Error handling message status:', error);
  }
};

// Handle incoming messages
const handleIncomingMessage = async (messageEvent) => {
  try {
    const { messageId, from, timestamp, text } = messageEvent;
    
    // Find the send log by recipient phone
    const sendLog = await SendLog.findOne({
      'recipient.phone': from,
      status: { $in: ['sent', 'delivered', 'read'] }
    }).sort({ createdAt: -1 });
    
    if (sendLog) {
      // Update send log with reply
      sendLog.status = 'replied';
      sendLog.metadata = {
        ...sendLog.metadata,
        replyMessageId: messageId,
        replyText: text,
        replyTimestamp: new Date(parseInt(timestamp) * 1000)
      };
      await sendLog.save();
      
      // Update campaign statistics
      const campaign = await Campaign.findById(sendLog.campaign);
      if (campaign) {
        await campaign.updateStatistics({ replied: 1 });
      }
      
      logger.info('Message reply received', {
        messageId,
        from,
        sendLogId: sendLog._id,
        replyText: text
      });
    }
    
  } catch (error) {
    logger.error('Error handling incoming message:', error);
  }
};

module.exports = router;