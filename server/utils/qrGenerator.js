const QRCode = require('qrcode');

/**
 * Generate QR code for a product
 * @param {string} data - The data to encode in the QR code
 * @param {Object} options - QR code generation options
 * @returns {Promise<string>} - Base64 encoded QR code image
 */
const generateQRCode = async (data, options = {}) => {
  const defaultOptions = {
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  };

  const qrOptions = { ...defaultOptions, ...options };

  try {
    const qrCodeImage = await QRCode.toDataURL(data, qrOptions);
    return qrCodeImage;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate QR code as buffer
 * @param {string} data - The data to encode in the QR code
 * @param {Object} options - QR code generation options
 * @returns {Promise<Buffer>} - QR code as buffer
 */
const generateQRCodeBuffer = async (data, options = {}) => {
  const defaultOptions = {
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  };

  const qrOptions = { ...defaultOptions, ...options };

  try {
    const qrCodeBuffer = await QRCode.toBuffer(data, qrOptions);
    return qrCodeBuffer;
  } catch (error) {
    console.error('Error generating QR code buffer:', error);
    throw new Error('Failed to generate QR code buffer');
  }
};

/**
 * Generate QR code as SVG
 * @param {string} data - The data to encode in the QR code
 * @param {Object} options - QR code generation options
 * @returns {Promise<string>} - QR code as SVG string
 */
const generateQRCodeSVG = async (data, options = {}) => {
  const defaultOptions = {
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  };

  const qrOptions = { ...defaultOptions, ...options };

  try {
    const qrCodeSVG = await QRCode.toString(data, { type: 'svg', ...qrOptions });
    return qrCodeSVG;
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw new Error('Failed to generate QR code SVG');
  }
};

/**
 * Validate QR code data
 * @param {string} data - The QR code data to validate
 * @returns {boolean} - Whether the data is valid
 */
const validateQRCodeData = (data) => {
  if (!data || typeof data !== 'string') {
    return false;
  }

  // Check if data is not too long (QR codes have size limits)
  if (data.length > 2953) { // Maximum for version 40, error correction level M
    return false;
  }

  return true;
};

/**
 * Generate unique QR code data for a product
 * @param {string} productId - The product ID
 * @param {string} sku - The product SKU
 * @returns {string} - Unique QR code data
 */
const generateUniqueQRData = (productId, sku) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${productId}-${sku}-${timestamp}-${random}`;
};

module.exports = {
  generateQRCode,
  generateQRCodeBuffer,
  generateQRCodeSVG,
  validateQRCodeData,
  generateUniqueQRData
};