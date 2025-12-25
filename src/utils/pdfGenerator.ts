// PDF Generator Utility for Fee Receipts and Report Cards

interface SchoolInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
}

interface FeeReceiptData {
  receiptNumber: string;
  date: string;
  studentName: string;
  studentClass: string;
  rollNumber?: string;
  feeType: string;
  amount: number;
  paidAmount: number;
  paymentDate: string;
  paymentMode?: string;
  school: SchoolInfo;
}

export const generateFeeReceiptHTML = (data: FeeReceiptData): string => {
  const logoSection = data.school.logo_url 
    ? `<img src="${data.school.logo_url}" alt="School Logo" style="max-height: 80px; max-width: 150px; object-fit: contain;" />`
    : `<div style="width: 80px; height: 80px; background: #f0f0f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #666; font-size: 12px;">No Logo</div>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Fee Receipt - ${data.receiptNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 14px;
          color: #333;
          background: #fff;
          padding: 20px;
        }
        .receipt {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid #1a365d;
          border-radius: 8px;
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%);
          color: white;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .school-info {
          flex: 1;
        }
        .school-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .school-details {
          font-size: 12px;
          opacity: 0.9;
        }
        .logo {
          margin-left: 20px;
          background: white;
          padding: 10px;
          border-radius: 8px;
        }
        .receipt-title {
          text-align: center;
          background: #f0f4f8;
          padding: 15px;
          font-size: 20px;
          font-weight: bold;
          color: #1a365d;
          border-bottom: 1px solid #e2e8f0;
        }
        .content {
          padding: 25px;
        }
        .receipt-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 1px dashed #e2e8f0;
        }
        .receipt-number {
          font-weight: bold;
          color: #1a365d;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 25px;
        }
        .detail-item {
          padding: 12px;
          background: #f7fafc;
          border-radius: 6px;
          border-left: 3px solid #2563eb;
        }
        .detail-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .detail-value {
          font-size: 16px;
          font-weight: 600;
          color: #1a365d;
        }
        .amount-section {
          background: #eef2ff;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
        }
        .amount-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e0e7ff;
        }
        .amount-row:last-child {
          border-bottom: none;
          font-size: 18px;
          font-weight: bold;
          color: #1a365d;
          padding-top: 12px;
        }
        .amount-row.paid {
          color: #059669;
        }
        .footer {
          text-align: center;
          padding: 20px;
          background: #f7fafc;
          border-top: 1px solid #e2e8f0;
        }
        .signature {
          margin-top: 30px;
          text-align: right;
          padding-right: 40px;
        }
        .signature-line {
          border-top: 1px solid #333;
          width: 200px;
          margin-left: auto;
          padding-top: 8px;
          font-size: 12px;
        }
        .watermark {
          text-align: center;
          font-size: 11px;
          color: #999;
          margin-top: 15px;
        }
        @media print {
          body { padding: 0; }
          .receipt { border: 1px solid #333; }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="school-info">
            <div class="school-name">${data.school.name}</div>
            <div class="school-details">
              ${data.school.address || ''}
              ${data.school.phone ? `<br>Phone: ${data.school.phone}` : ''}
              ${data.school.email ? ` | Email: ${data.school.email}` : ''}
            </div>
          </div>
          <div class="logo">
            ${logoSection}
          </div>
        </div>
        
        <div class="receipt-title">FEE RECEIPT</div>
        
        <div class="content">
          <div class="receipt-info">
            <div class="receipt-number">Receipt No: ${data.receiptNumber}</div>
            <div>Date: ${data.date}</div>
          </div>
          
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Student Name</div>
              <div class="detail-value">${data.studentName}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Class</div>
              <div class="detail-value">${data.studentClass}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Roll Number</div>
              <div class="detail-value">${data.rollNumber || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Fee Type</div>
              <div class="detail-value">${data.feeType}</div>
            </div>
          </div>
          
          <div class="amount-section">
            <div class="amount-row">
              <span>Total Fee Amount</span>
              <span>₹${data.amount.toLocaleString('en-IN')}</span>
            </div>
            <div class="amount-row paid">
              <span>Amount Paid</span>
              <span>₹${data.paidAmount.toLocaleString('en-IN')}</span>
            </div>
            <div class="amount-row">
              <span>Balance Due</span>
              <span>₹${(data.amount - data.paidAmount).toLocaleString('en-IN')}</span>
            </div>
          </div>
          
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Payment Date</div>
              <div class="detail-value">${data.paymentDate}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Payment Mode</div>
              <div class="detail-value">${data.paymentMode || 'Cash'}</div>
            </div>
          </div>
          
          <div class="signature">
            <div class="signature-line">Authorized Signature</div>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Thank you for your payment!</strong></p>
          <p class="watermark">This is a computer-generated receipt and does not require a physical signature.</p>
          <p class="watermark">Generated by SkoolSetu - School Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const downloadFeeReceipt = (data: FeeReceiptData): void => {
  const html = generateFeeReceiptHTML(data);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for images to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }
};

export const openFeeReceiptPreview = (data: FeeReceiptData): void => {
  const html = generateFeeReceiptHTML(data);
  const previewWindow = window.open('', '_blank');
  
  if (previewWindow) {
    previewWindow.document.write(html);
    previewWindow.document.close();
  }
};
