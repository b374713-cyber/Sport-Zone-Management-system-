// Back_end/utils/pdfGenerator.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a gaming cash receipt PDF
 * @param {Object} data - Session and payment data
 * @param {string} outputPath - Where to save the PDF
 * @returns {Promise<string>} - Path to generated PDF
 */
async function generateGamingCashReceipt(data, outputPath = null) {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Cash Receipt - Gaming Session #${data.session_id}`,
          Author: 'Sport Zone',
          Subject: 'Cash Payment Receipt',
          Keywords: 'gaming, cash, receipt, sport zone',
          CreationDate: new Date(),
        }
      });

      // If outputPath provided, pipe to file
      // Otherwise, collect as buffer
      let buffers = [];
      if (!outputPath) {
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
      } else {
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);
        stream.on('finish', () => resolve(outputPath));
      }

      // ========== PDF CONTENT ==========
      
      // Header with logo and title
      doc.fontSize(24)
         .fillColor('#3b2a88')
         .text('🎮 SPORT ZONE GAMING', { align: 'center' });
      
      doc.moveDown(0.5);
      doc.fontSize(14)
         .fillColor('#666666')
         .text('CASH PAYMENT RECEIPT', { align: 'center' });
      
      doc.moveDown(1);
      
      // Paid stamp
      doc.fontSize(16)
         .fillColor('#28a745')
         .text('✅ PAID IN CASH', { align: 'center' });
      
      doc.moveDown(1.5);
      
      // Receipt Details Section
      doc.fontSize(12)
         .fillColor('#3b2a88')
         .text('RECEIPT DETAILS', { underline: true });
      
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#000000');
      
      doc.text(`Receipt Number: GAMING-CASH-${data.session_id}`);
      doc.text(`Issue Date: ${new Date().toLocaleDateString()}`);
      doc.text(`Payment Date: ${new Date(data.paid_at || new Date()).toLocaleString()}`);
      doc.text(`Payment Method: Cash`);
      
      doc.moveDown(1);
      
      // Customer Information
      doc.fontSize(12)
         .fillColor('#3b2a88')
         .text('CUSTOMER INFORMATION', { underline: true });
      
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#000000');
      
      doc.text(`Customer Name: ${data.customer_name || data.player_name}`);
      doc.text(`Email: ${data.customer_email || 'N/A'}`);
      doc.text(`Phone: ${data.customer_phone || 'N/A'}`);
      
      doc.moveDown(1);
      
      // Session Details
      doc.fontSize(12)
         .fillColor('#3b2a88')
         .text('SESSION DETAILS', { underline: true });
      
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#000000');
      
      doc.text(`Session ID: ${data.session_id}`);
      doc.text(`Player Name: ${data.player_name}`);
      doc.text(`Device: ${data.device_name} (${data.device_type})`);
      doc.text(`Room: Section ${data.section}-Room ${data.room_number}`);
      doc.text(`Session Type: ${data.session_type}`);
      if (data.hours_played) {
        doc.text(`Hours Played: ${data.hours_played}`);
      }
      
      doc.moveDown(1);
      
      // Payment Summary
      doc.fontSize(12)
         .fillColor('#3b2a88')
         .text('PAYMENT SUMMARY', { underline: true });
      
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#000000');
      
      const amount = data.final_amount || data.amount || 0;
      const currency = data.currency || 'USD';
      
      // Create a simple table
      const startX = 50;
      let y = doc.y;
      
      // Header
      doc.fontSize(10).fillColor('#ffffff');
      doc.rect(startX, y, 500, 20).fill('#3b2a88');
      doc.text('Description', startX + 10, y + 5);
      doc.text('Amount', startX + 400, y + 5);
      
      y += 25;
      doc.fontSize(10).fillColor('#000000');
      
      // Base amount row
      doc.text('Gaming Session Fee', startX + 10, y);
      doc.text(`${currency} ${amount.toFixed(2)}`, startX + 400, y);
      
      y += 20;
      
      // Discount if exists
      if (data.discount_amount && data.discount_amount > 0) {
        doc.text('Discount', startX + 10, y);
        doc.text(`-${currency} ${data.discount_amount.toFixed(2)}`, startX + 400, y);
        y += 20;
      }
      
      // Total row
      doc.moveTo(startX, y).lineTo(startX + 500, y).stroke();
      y += 10;
      
      doc.fontSize(14).fillColor('#3b2a88').font('Helvetica-Bold');
      doc.text('TOTAL PAID', startX + 10, y);
      doc.text(`${currency} ${amount.toFixed(2)}`, startX + 400, y);
      
      doc.moveDown(2);
      
      // Footer
      doc.fontSize(10)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Thank you for choosing Sport Zone Gaming!', { align: 'center' });
      
      doc.text('This is an official receipt for cash payment.', { align: 'center' });
      doc.text(`Receipt generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      
      // Finalize PDF
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate and save PDF, return file path
 */
async function generateAndSaveCashReceipt(data, sessionId) {
  try {
    // Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads', 'gaming-receipts');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filename = `cash-receipt-${sessionId}-${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, filename);
    
    // Generate PDF
    await generateGamingCashReceipt(data, filePath);
    
    // Return relative URL for accessing
    return `/uploads/gaming-receipts/${filename}`;
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

module.exports = {
  generateGamingCashReceipt,
  generateAndSaveCashReceipt
};