const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

/**
 * Builds a unique, human-readable certificate ID.
 * Format: HIA-CERT-<YEAR>-<6 random alphanumeric>
 */
const generateCertificateId = () => {
  const year = new Date().getFullYear();
  const rand = uuidv4().split('-')[0].toUpperCase();
  return `HIA-CERT-${year}-${rand}`;
};

/**
 * Generates a certificate PDF (landscape, branded), embeds a QR code that links
 * to the public verification page, uploads it to Cloudinary as a raw PDF asset,
 * and returns the resulting URLs + certificate ID.
 */
const generateCertificatePdfBuffer = async ({
  studentName,
  courseTitle,
  certificateId,
  issueDate,
  grade,
  verificationUrl,
}) => {
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 180 });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 0 });
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve({ buffer: Buffer.concat(buffers), qrDataUrl }));
    doc.on('error', reject);

    const PAGE_W = doc.page.width;
    const PAGE_H = doc.page.height;
    const NAVY = '#0B2A5B';
    const ORANGE = '#F57C00';

    // Background
    doc.rect(0, 0, PAGE_W, PAGE_H).fill('#FFFFFF');
    // Outer border
    doc.lineWidth(6).strokeColor(NAVY).rect(24, 24, PAGE_W - 48, PAGE_H - 48).stroke();
    doc.lineWidth(2).strokeColor(ORANGE).rect(36, 36, PAGE_W - 72, PAGE_H - 72).stroke();

    // Header band
    doc.rect(0, 0, PAGE_W, 14).fill(NAVY);
    doc.rect(0, PAGE_H - 14, PAGE_W, 14).fill(ORANGE);

    doc
      .fillColor(NAVY)
      .font('Helvetica-Bold')
      .fontSize(30)
      .text('HireIA LMS', 0, 70, { align: 'center' });

    doc
      .fillColor('#475569')
      .font('Helvetica')
      .fontSize(14)
      .text('Certificate of Completion', 0, 108, { align: 'center', characterSpacing: 2 });

    doc
      .moveTo(PAGE_W / 2 - 60, 132)
      .lineTo(PAGE_W / 2 + 60, 132)
      .lineWidth(2)
      .strokeColor(ORANGE)
      .stroke();

    doc
      .fillColor('#334155')
      .font('Helvetica')
      .fontSize(13)
      .text('This is to certify that', 0, 160, { align: 'center' });

    doc
      .fillColor(NAVY)
      .font('Helvetica-Bold')
      .fontSize(32)
      .text(studentName, 0, 188, { align: 'center' });

    doc
      .fillColor('#334155')
      .font('Helvetica')
      .fontSize(13)
      .text('has successfully completed the course', 0, 234, { align: 'center' });

    doc
      .fillColor(ORANGE)
      .font('Helvetica-Bold')
      .fontSize(22)
      .text(courseTitle, 60, 262, { align: 'center', width: PAGE_W - 120 });

    if (grade) {
      doc
        .fillColor('#334155')
        .font('Helvetica')
        .fontSize(12)
        .text(`Grade Awarded: ${grade}`, 0, 300, { align: 'center' });
    }

    // Footer: issue date, cert ID, QR
    const footerY = PAGE_H - 130;
    doc
      .fillColor('#475569')
      .fontSize(10)
      .font('Helvetica')
      .text(`Issue Date: ${new Date(issueDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, 90, footerY)
      .text(`Certificate ID: ${certificateId}`, 90, footerY + 16)
      .text('Verify at: hireia-lms.com/verify', 90, footerY + 32);

    doc.image(qrDataUrl, PAGE_W - 190, footerY - 10, { width: 100, height: 100 });
    doc
      .fontSize(8)
      .fillColor('#94a3b8')
      .text('Scan to verify', PAGE_W - 190, footerY + 92, { width: 100, align: 'center' });

    doc.end();
  });
};

const uploadPdfBufferToCloudinary = (buffer, publicId) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'hireia/certificates',
        public_id: publicId,
        format: 'pdf',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });

module.exports = { generateCertificateId, generateCertificatePdfBuffer, uploadPdfBufferToCloudinary };
