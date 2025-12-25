// Receipt Template Generator with Multiple Formats

export type ReceiptTemplate = "A4" | "Letter" | "Receipt" | "Thermal";

interface SchoolInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
}

interface ReceiptData {
  receiptNumber: string;
  date: string;
  studentName: string;
  studentClass: string;
  rollNumber?: string;
  parentName?: string;
  feeType: string;
  amount: number;
  paidAmount: number;
  currentPayment: number;
  paymentDate: string;
  paymentMode: string;
  transactionRef?: string;
  school: SchoolInfo;
  signatureUrl?: string;
  authorizedName?: string;
}

const getCommonStyles = () => `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #333;
    background: #fff;
  }
  .amount-value {
    font-weight: bold;
    color: #1a365d;
  }
  .paid {
    color: #059669;
  }
  .balance {
    color: #dc2626;
  }
`;

const getLogoSection = (logoUrl?: string) => {
  if (logoUrl) {
    return `<img src="${logoUrl}" alt="School Logo" style="max-height: 80px; max-width: 150px; object-fit: contain;" />`;
  }
  return `<div style="width: 60px; height: 60px; background: #f0f0f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #666; font-size: 10px;">Logo</div>`;
};

const getSignatureSection = (signatureUrl?: string, authorizedName?: string) => {
  return `
    <div class="signature-section">
      ${signatureUrl 
        ? `<img src="${signatureUrl}" alt="Signature" class="signature-image" />`
        : `<div class="signature-line"></div>`
      }
      <p class="signature-name">${authorizedName || "Authorized Signatory"}</p>
    </div>
  `;
};

// A4 Template - Full Page Professional
const generateA4Template = (data: ReceiptData): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Fee Receipt - ${data.receiptNumber}</title>
  <style>
    ${getCommonStyles()}
    body { padding: 40px; font-size: 14px; }
    .receipt {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #1a365d;
      border-radius: 12px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%);
      color: white;
      padding: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .school-info { flex: 1; }
    .school-name { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
    .school-details { font-size: 13px; opacity: 0.9; line-height: 1.6; }
    .logo { margin-left: 30px; background: white; padding: 15px; border-radius: 10px; }
    .receipt-title {
      text-align: center;
      background: #f0f4f8;
      padding: 20px;
      font-size: 24px;
      font-weight: bold;
      color: #1a365d;
      border-bottom: 2px solid #e2e8f0;
      letter-spacing: 2px;
    }
    .content { padding: 30px; }
    .receipt-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px dashed #e2e8f0;
    }
    .receipt-number { font-weight: bold; color: #1a365d; font-size: 16px; }
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .detail-item {
      padding: 15px;
      background: #f7fafc;
      border-radius: 8px;
      border-left: 4px solid #2563eb;
    }
    .detail-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
    .detail-value { font-size: 18px; font-weight: 600; color: #1a365d; }
    .amount-section {
      background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
      padding: 25px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .amount-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #c7d2fe;
      font-size: 16px;
    }
    .amount-row:last-child { border-bottom: none; font-size: 20px; padding-top: 15px; }
    .payment-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
    .payment-item { text-align: center; padding: 15px; background: #f7fafc; border-radius: 8px; }
    .signature-section { text-align: right; margin-top: 40px; padding-right: 40px; }
    .signature-image { max-height: 60px; max-width: 150px; margin-bottom: 5px; }
    .signature-line { border-top: 2px solid #333; width: 200px; margin-left: auto; margin-bottom: 5px; }
    .signature-name { font-size: 14px; color: #666; }
    .footer {
      text-align: center;
      padding: 25px;
      background: #f7fafc;
      border-top: 2px solid #e2e8f0;
      font-size: 12px;
      color: #666;
    }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="school-info">
        <div class="school-name">${data.school.name}</div>
        <div class="school-details">
          ${data.school.address || ''}
          ${data.school.phone ? `<br>📞 ${data.school.phone}` : ''}
          ${data.school.email ? ` | ✉ ${data.school.email}` : ''}
        </div>
      </div>
      <div class="logo">${getLogoSection(data.school.logo_url)}</div>
    </div>
    
    <div class="receipt-title">FEE RECEIPT</div>
    
    <div class="content">
      <div class="receipt-meta">
        <div class="receipt-number">Receipt No: ${data.receiptNumber}</div>
        <div>Date: ${data.date}</div>
      </div>
      
      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-label">Student Name</div>
          <div class="detail-value">${data.studentName}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Class / Section</div>
          <div class="detail-value">${data.studentClass}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Roll Number</div>
          <div class="detail-value">${data.rollNumber || 'N/A'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Parent/Guardian</div>
          <div class="detail-value">${data.parentName || 'N/A'}</div>
        </div>
      </div>
      
      <div class="amount-section">
        <div class="amount-row">
          <span>Fee Type</span>
          <span class="amount-value">${data.feeType}</span>
        </div>
        <div class="amount-row">
          <span>Total Fee Amount</span>
          <span class="amount-value">₹${data.amount.toLocaleString('en-IN')}</span>
        </div>
        <div class="amount-row">
          <span>Current Payment</span>
          <span class="amount-value paid">₹${data.currentPayment.toLocaleString('en-IN')}</span>
        </div>
        <div class="amount-row">
          <span>Total Paid (Including Current)</span>
          <span class="amount-value paid">₹${data.paidAmount.toLocaleString('en-IN')}</span>
        </div>
        <div class="amount-row">
          <span><strong>Balance Due</strong></span>
          <span class="amount-value balance">₹${(data.amount - data.paidAmount).toLocaleString('en-IN')}</span>
        </div>
      </div>
      
      <div class="payment-info">
        <div class="payment-item">
          <div class="detail-label">Payment Date</div>
          <div class="detail-value">${data.paymentDate}</div>
        </div>
        <div class="payment-item">
          <div class="detail-label">Payment Mode</div>
          <div class="detail-value">${data.paymentMode}</div>
        </div>
        <div class="payment-item">
          <div class="detail-label">Transaction Ref</div>
          <div class="detail-value">${data.transactionRef || '-'}</div>
        </div>
      </div>
      
      ${getSignatureSection(data.signatureUrl, data.authorizedName)}
    </div>
    
    <div class="footer">
      <p><strong>Thank you for your payment!</strong></p>
      <p style="margin-top: 10px;">This is a computer-generated receipt. For queries, contact the school office.</p>
      <p style="margin-top: 5px;">Powered by SkoolSetu</p>
    </div>
  </div>
</body>
</html>
`;

// Letter Template - Standard Business Letter Size
const generateLetterTemplate = (data: ReceiptData): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Fee Receipt - ${data.receiptNumber}</title>
  <style>
    ${getCommonStyles()}
    body { padding: 30px; font-size: 13px; }
    .receipt { max-width: 700px; margin: 0 auto; border: 1px solid #ddd; }
    .header {
      background: #1a365d;
      color: white;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .school-name { font-size: 22px; font-weight: bold; }
    .school-details { font-size: 11px; opacity: 0.9; margin-top: 5px; }
    .logo { background: white; padding: 10px; border-radius: 6px; }
    .receipt-title {
      text-align: center;
      background: #f5f5f5;
      padding: 12px;
      font-size: 18px;
      font-weight: bold;
      border-bottom: 1px solid #ddd;
    }
    .content { padding: 20px; }
    .receipt-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      font-size: 12px;
    }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f5f5f5; font-weight: 600; }
    .amount-table td:last-child { text-align: right; font-weight: bold; }
    .signature-section { text-align: right; margin-top: 30px; }
    .signature-image { max-height: 50px; max-width: 120px; }
    .signature-line { border-top: 1px solid #333; width: 150px; margin-left: auto; }
    .signature-name { font-size: 12px; color: #666; margin-top: 5px; }
    .footer { text-align: center; padding: 15px; background: #f5f5f5; font-size: 11px; color: #666; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div>
        <div class="school-name">${data.school.name}</div>
        <div class="school-details">${data.school.address || ''} ${data.school.phone ? `| ${data.school.phone}` : ''}</div>
      </div>
      <div class="logo">${getLogoSection(data.school.logo_url)}</div>
    </div>
    
    <div class="receipt-title">FEE RECEIPT</div>
    
    <div class="content">
      <div class="receipt-meta">
        <span><strong>Receipt No:</strong> ${data.receiptNumber}</span>
        <span><strong>Date:</strong> ${data.date}</span>
      </div>
      
      <table>
        <tr><th width="30%">Student Name</th><td>${data.studentName}</td></tr>
        <tr><th>Class / Section</th><td>${data.studentClass}</td></tr>
        <tr><th>Roll Number</th><td>${data.rollNumber || 'N/A'}</td></tr>
        <tr><th>Parent/Guardian</th><td>${data.parentName || 'N/A'}</td></tr>
      </table>
      
      <table class="amount-table">
        <tr><th>Description</th><th width="30%">Amount</th></tr>
        <tr><td>${data.feeType}</td><td>₹${data.amount.toLocaleString('en-IN')}</td></tr>
        <tr><td>Current Payment (${data.paymentMode})</td><td class="paid">₹${data.currentPayment.toLocaleString('en-IN')}</td></tr>
        <tr><td>Total Paid</td><td class="paid">₹${data.paidAmount.toLocaleString('en-IN')}</td></tr>
        <tr><td><strong>Balance Due</strong></td><td class="balance">₹${(data.amount - data.paidAmount).toLocaleString('en-IN')}</td></tr>
      </table>
      
      ${getSignatureSection(data.signatureUrl, data.authorizedName)}
    </div>
    
    <div class="footer">
      Thank you for your payment! | Powered by SkoolSetu
    </div>
  </div>
</body>
</html>
`;

// Receipt Template - Compact Half Page
const generateReceiptTemplate = (data: ReceiptData): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Fee Receipt - ${data.receiptNumber}</title>
  <style>
    ${getCommonStyles()}
    body { padding: 20px; font-size: 12px; }
    .receipt { max-width: 400px; margin: 0 auto; border: 2px solid #333; }
    .header {
      background: #1a365d;
      color: white;
      padding: 15px;
      text-align: center;
    }
    .school-name { font-size: 16px; font-weight: bold; }
    .school-details { font-size: 10px; opacity: 0.8; margin-top: 5px; }
    .receipt-title {
      text-align: center;
      padding: 8px;
      font-size: 14px;
      font-weight: bold;
      background: #f0f0f0;
      border-bottom: 1px dashed #333;
    }
    .content { padding: 15px; }
    .row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #ddd; }
    .row:last-child { border-bottom: none; }
    .label { color: #666; }
    .value { font-weight: 600; }
    .divider { border-top: 1px dashed #333; margin: 10px 0; }
    .total-row { font-size: 14px; font-weight: bold; padding: 10px 0; }
    .signature-section { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #333; }
    .signature-image { max-height: 40px; max-width: 100px; }
    .signature-name { font-size: 10px; color: #666; }
    .footer { text-align: center; padding: 10px; font-size: 9px; color: #666; background: #f5f5f5; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="school-name">${data.school.name}</div>
      <div class="school-details">${data.school.address || ''}</div>
    </div>
    
    <div class="receipt-title">FEE RECEIPT</div>
    
    <div class="content">
      <div class="row"><span class="label">Receipt #:</span><span class="value">${data.receiptNumber}</span></div>
      <div class="row"><span class="label">Date:</span><span class="value">${data.date}</span></div>
      <div class="divider"></div>
      <div class="row"><span class="label">Student:</span><span class="value">${data.studentName}</span></div>
      <div class="row"><span class="label">Class:</span><span class="value">${data.studentClass}</span></div>
      <div class="row"><span class="label">Roll No:</span><span class="value">${data.rollNumber || 'N/A'}</span></div>
      <div class="divider"></div>
      <div class="row"><span class="label">Fee Type:</span><span class="value">${data.feeType}</span></div>
      <div class="row"><span class="label">Total Amount:</span><span class="value">₹${data.amount.toLocaleString('en-IN')}</span></div>
      <div class="row"><span class="label">Paid Now:</span><span class="value paid">₹${data.currentPayment.toLocaleString('en-IN')}</span></div>
      <div class="row"><span class="label">Mode:</span><span class="value">${data.paymentMode}</span></div>
      <div class="divider"></div>
      <div class="row total-row"><span>Balance Due:</span><span class="balance">₹${(data.amount - data.paidAmount).toLocaleString('en-IN')}</span></div>
      
      <div class="signature-section">
        ${data.signatureUrl ? `<img src="${data.signatureUrl}" class="signature-image" />` : ''}
        <div class="signature-name">${data.authorizedName || 'Authorized Signatory'}</div>
      </div>
    </div>
    
    <div class="footer">Thank you! | Powered by SkoolSetu</div>
  </div>
</body>
</html>
`;

// Thermal Template - POS Printer Format
const generateThermalTemplate = (data: ReceiptData): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Fee Receipt - ${data.receiptNumber}</title>
  <style>
    ${getCommonStyles()}
    body { padding: 10px; font-size: 11px; font-family: 'Courier New', monospace; }
    .receipt { max-width: 280px; margin: 0 auto; }
    .header { text-align: center; padding-bottom: 10px; border-bottom: 1px dashed #333; }
    .school-name { font-size: 14px; font-weight: bold; }
    .school-details { font-size: 9px; margin-top: 5px; }
    .receipt-title { text-align: center; padding: 8px 0; font-weight: bold; font-size: 12px; }
    .content { padding: 10px 0; }
    .row { display: flex; justify-content: space-between; padding: 3px 0; }
    .divider { border-top: 1px dashed #333; margin: 8px 0; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .signature-section { text-align: center; margin-top: 15px; }
    .signature-image { max-height: 30px; max-width: 80px; }
    .footer { text-align: center; padding-top: 10px; font-size: 9px; border-top: 1px dashed #333; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="school-name">${data.school.name}</div>
      <div class="school-details">${data.school.phone || ''}</div>
    </div>
    
    <div class="receipt-title">*** FEE RECEIPT ***</div>
    
    <div class="content">
      <div class="row"><span>Receipt#:</span><span>${data.receiptNumber}</span></div>
      <div class="row"><span>Date:</span><span>${data.date}</span></div>
      <div class="divider"></div>
      <div class="row"><span>Student:</span><span>${data.studentName}</span></div>
      <div class="row"><span>Class:</span><span>${data.studentClass}</span></div>
      <div class="divider"></div>
      <div class="row"><span>Fee:</span><span>${data.feeType}</span></div>
      <div class="row"><span>Total:</span><span>Rs.${data.amount}</span></div>
      <div class="row"><span>Paid:</span><span>Rs.${data.currentPayment}</span></div>
      <div class="row"><span>Mode:</span><span>${data.paymentMode}</span></div>
      <div class="divider"></div>
      <div class="row bold"><span>BALANCE:</span><span>Rs.${data.amount - data.paidAmount}</span></div>
      
      <div class="signature-section">
        ${data.signatureUrl ? `<img src="${data.signatureUrl}" class="signature-image" />` : ''}
      </div>
    </div>
    
    <div class="footer">
      <p>Thank you!</p>
      <p>SkoolSetu</p>
    </div>
  </div>
</body>
</html>
`;

export const generateReceiptHTML = (data: ReceiptData, template: ReceiptTemplate): string => {
  switch (template) {
    case "A4":
      return generateA4Template(data);
    case "Letter":
      return generateLetterTemplate(data);
    case "Receipt":
      return generateReceiptTemplate(data);
    case "Thermal":
      return generateThermalTemplate(data);
    default:
      return generateA4Template(data);
  }
};