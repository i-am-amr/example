const axios = require('axios');
const logger = require('../utils/logger');

class WhatsAppService {
  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL;
    this.apiToken = process.env.WHATSAPP_API_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.isEnabled = !!(this.apiUrl && this.apiToken && this.phoneNumberId);
  }

  /**
   * Send a WhatsApp message
   * @param {string} to - Recipient phone number
   * @param {string} message - Message content
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Send result
   */
  async sendMessage(to, message, options = {}) {
    if (!this.isEnabled) {
      throw new Error('WhatsApp service is not configured');
    }

    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(to),
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await axios.post(
        `${this.apiUrl}/v17.0/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      logger.info('WhatsApp message sent successfully', {
        to,
        messageId: response.data.messages[0].id
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        response: response.data
      };

    } catch (error) {
      logger.error('WhatsApp message send failed', {
        to,
        error: error.message,
        response: error.response?.data
      });

      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Send a template message
   * @param {string} to - Recipient phone number
   * @param {string} templateName - Template name
   * @param {Array} parameters - Template parameters
   * @returns {Promise<Object>} - Send result
   */
  async sendTemplateMessage(to, templateName, parameters = []) {
    if (!this.isEnabled) {
      throw new Error('WhatsApp service is not configured');
    }

    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(to),
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: 'en'
          },
          components: parameters.length > 0 ? [
            {
              type: 'body',
              parameters: parameters.map(param => ({
                type: 'text',
                text: param
              }))
            }
          ] : []
        }
      };

      const response = await axios.post(
        `${this.apiUrl}/v17.0/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      logger.info('WhatsApp template message sent successfully', {
        to,
        templateName,
        messageId: response.data.messages[0].id
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        response: response.data
      };

    } catch (error) {
      logger.error('WhatsApp template message send failed', {
        to,
        templateName,
        error: error.message,
        response: error.response?.data
      });

      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Get message status
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} - Message status
   */
  async getMessageStatus(messageId) {
    if (!this.isEnabled) {
      throw new Error('WhatsApp service is not configured');
    }

    try {
      const response = await axios.get(
        `${this.apiUrl}/v17.0/${this.phoneNumberId}/messages/${messageId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`
          }
        }
      );

      return {
        success: true,
        status: response.data.status,
        response: response.data
      };

    } catch (error) {
      logger.error('WhatsApp message status check failed', {
        messageId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Format phone number for WhatsApp API
   * @param {string} phoneNumber - Phone number
   * @returns {string} - Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming India +91)
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Validate phone number
   * @param {string} phoneNumber - Phone number
   * @returns {boolean} - Whether phone number is valid
   */
  isValidPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  /**
   * Process webhook data
   * @param {Object} webhookData - Webhook payload
   * @returns {Object} - Processed webhook data
   */
  processWebhook(webhookData) {
    try {
      const entries = webhookData.entry || [];
      const processedData = [];

      entries.forEach(entry => {
        const changes = entry.changes || [];
        changes.forEach(change => {
          const messages = change.value?.messages || [];
          const statuses = change.value?.statuses || [];

          // Process incoming messages
          messages.forEach(message => {
            processedData.push({
              type: 'message',
              messageId: message.id,
              from: message.from,
              timestamp: message.timestamp,
              type: message.type,
              text: message.text?.body,
              context: message.context
            });
          });

          // Process message statuses
          statuses.forEach(status => {
            processedData.push({
              type: 'status',
              messageId: status.id,
              status: status.status,
              timestamp: status.timestamp,
              recipientId: status.recipient_id,
              conversation: status.conversation,
              pricing: status.pricing
            });
          });
        });
      });

      return processedData;

    } catch (error) {
      logger.error('WhatsApp webhook processing failed', {
        error: error.message,
        webhookData
      });
      throw error;
    }
  }

  /**
   * Check if service is enabled
   * @returns {boolean} - Whether service is enabled
   */
  isServiceEnabled() {
    return this.isEnabled;
  }

  /**
   * Get service configuration
   * @returns {Object} - Service configuration
   */
  getConfiguration() {
    return {
      enabled: this.isEnabled,
      apiUrl: this.apiUrl,
      phoneNumberId: this.phoneNumberId,
      hasToken: !!this.apiToken
    };
  }
}

module.exports = new WhatsAppService();