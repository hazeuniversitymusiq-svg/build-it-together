/**
 * FLOW Partner Pitch Deck PDF Generator
 * 
 * Generates a professional PDF summary for bank partners
 * Uses only ASCII characters for maximum compatibility
 */

import { jsPDF } from 'jspdf';

// Colors (RGB)
const COLORS = {
  primary: [99, 102, 241] as [number, number, number],
  text: [30, 30, 35] as [number, number, number],
  muted: [100, 100, 110] as [number, number, number],
  accent: [16, 185, 129] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightBg: [248, 250, 252] as [number, number, number],
};

export function generatePartnerPitchPDF(): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Helper: Add text
  const addText = (text: string, x: number, y: number, options?: {
    fontSize?: number;
    color?: [number, number, number];
    fontStyle?: 'normal' | 'bold';
    maxWidth?: number;
    align?: 'left' | 'center' | 'right';
    font?: 'helvetica' | 'courier';
  }) => {
    const { 
      fontSize = 12, 
      color = COLORS.text, 
      fontStyle = 'normal', 
      maxWidth, 
      align = 'left',
      font = 'helvetica'
    } = options || {};
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    doc.setFont(font, fontStyle);
    if (maxWidth) {
      doc.text(text, x, y, { maxWidth, align });
    } else {
      doc.text(text, x, y, { align });
    }
  };

  // Helper: Section header
  const addSection = (title: string, y: number): number => {
    doc.setFillColor(...COLORS.primary);
    doc.rect(margin, y, 4, 8, 'F');
    addText(title, margin + 10, y + 6, { fontSize: 14, fontStyle: 'bold', color: COLORS.primary });
    return y + 15;
  };

  // Helper: Bullet point
  const addBullet = (text: string, y: number, indent: number = 0): number => {
    doc.setFillColor(...COLORS.accent);
    doc.circle(margin + indent + 3, y - 1.5, 1.5, 'F');
    addText(text, margin + indent + 10, y, { fontSize: 10, maxWidth: pageWidth - margin * 2 - indent - 15 });
    return y + 7;
  };

  // Helper: Page footer
  const addPageFooter = (pageNum: number) => {
    doc.setDrawColor(...COLORS.muted);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    addText('FLOW Bank Partnership Summary', margin, pageHeight - 10, { fontSize: 8, color: COLORS.muted });
    addText('Page ' + pageNum, pageWidth - margin, pageHeight - 10, { fontSize: 8, color: COLORS.muted, align: 'right' });
  };

  // ==================== PAGE 1: Cover ====================
  
  // Header band
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  // Logo and title
  addText('FLOW', margin, 35, { fontSize: 36, fontStyle: 'bold', color: COLORS.white });
  addText('Bank Partnership Proposal', margin, 48, { fontSize: 14, color: COLORS.white });
  
  yPos = 80;
  
  // Tagline
  addText('Unified Payment Orchestration for Malaysia', margin, yPos, { fontSize: 18, fontStyle: 'bold' });
  
  yPos += 15;
  addText(
    'Partner with FLOW to deliver seamless "Scan - Authorize - Pay" experiences across Malaysia\'s fragmented payment ecosystem.',
    margin,
    yPos,
    { fontSize: 11, color: COLORS.muted, maxWidth: pageWidth - margin * 2 }
  );
  
  yPos += 25;
  
  // Key Stats
  yPos = addSection('Key Metrics', yPos);
  
  const stats = [
    { value: '3M+', label: 'Potential Users' },
    { value: '40%', label: 'Higher Completion' },
    { value: '<2s', label: 'Scan to Payment' },
    { value: 'Bank-grade', label: 'Security Level' },
  ];
  
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, yPos - 5, pageWidth - margin * 2, 28, 3, 3, 'F');
  
  const statWidth = (pageWidth - margin * 2) / 4;
  stats.forEach((stat, i) => {
    const x = margin + (i * statWidth) + statWidth / 2;
    addText(stat.value, x, yPos + 7, { fontSize: 16, fontStyle: 'bold', color: COLORS.primary, align: 'center' });
    addText(stat.label, x, yPos + 15, { fontSize: 8, color: COLORS.muted, align: 'center' });
  });
  
  yPos += 35;
  
  // Problem Statement
  yPos = addSection('The Problem', yPos);
  yPos = addBullet('Malaysia has 50+ payment apps - users juggle 3-5 daily', yPos);
  yPos = addBullet('Constant app switching, balance checking, failed payments', yPos);
  yPos = addBullet('No unified view of spending across wallets and banks', yPos);
  
  yPos += 8;
  
  // Solution
  yPos = addSection('FLOW Solution', yPos);
  yPos = addBullet('One scan works with any DuitNow QR - FLOW finds the best way to pay', yPos);
  yPos = addBullet('Smart resolution engine checks balances and applies user preferences', yPos);
  yPos = addBullet('Biometric confirmation, then handoff to wallet for execution', yPos);
  yPos = addBullet('FLOW orchestrates, not holds money - zero regulatory friction', yPos);
  
  yPos += 8;
  
  // Integration Requirements
  yPos = addSection('Integration Requirements', yPos);
  addText('Just 4 API endpoints to power millions of payments:', margin, yPos, { fontSize: 10, color: COLORS.muted });
  yPos += 10;
  
  const apis = [
    'GET  /api/v1/accounts/{id}/balance',
    'POST /api/v1/payments/initiate',
    'GET  /api/v1/payments/{id}/status',
    'GET  /api/v1/accounts/{id}/transactions',
  ];
  
  apis.forEach(api => {
    addText(api, margin + 5, yPos, { fontSize: 9, font: 'courier' });
    yPos += 6;
  });
  
  addPageFooter(1);
  
  // ==================== PAGE 2: Technical Details ====================
  doc.addPage();
  yPos = margin;
  
  // Header
  addText('Technical Architecture', margin, yPos, { fontSize: 18, fontStyle: 'bold' });
  yPos += 15;
  
  // Production components
  yPos = addSection('Production-Ready Components', yPos);
  
  const components = [
    { name: 'Resolution Engine', status: 'READY', desc: 'Rule-based payment routing with fallback logic' },
    { name: 'Security Layer', status: 'READY', desc: '4-layer security: device, transport, application, transaction' },
    { name: 'Orchestration', status: 'READY', desc: 'Intent to Plan to Execute flow with full state management' },
    { name: 'Bank Integration', status: 'SPEC', desc: 'Open Banking compliant API specification ready' },
  ];
  
  components.forEach(comp => {
    addText(comp.name, margin, yPos, { fontSize: 11, fontStyle: 'bold' });
    const statusColor = comp.status === 'READY' ? COLORS.accent : COLORS.muted;
    addText('[' + comp.status + ']', pageWidth - margin - 25, yPos, { fontSize: 9, color: statusColor, fontStyle: 'bold' });
    yPos += 5;
    addText(comp.desc, margin, yPos, { fontSize: 9, color: COLORS.muted });
    yPos += 10;
  });
  
  yPos += 5;
  
  // Security
  yPos = addSection('Security and Compliance', yPos);
  
  const securityItems = [
    'OAuth 2.0 + PKCE authentication',
    'TLS 1.3 with certificate pinning',
    'HMAC transaction signing',
    'Tamper-evident audit logging',
    'PCI-DSS ready architecture',
    'PDPA compliant data handling',
    'BNM guideline alignment',
  ];
  
  securityItems.forEach(item => {
    yPos = addBullet(item, yPos);
  });
  
  yPos += 8;
  
  // Partnership Models
  yPos = addSection('Partnership Models', yPos);
  
  const models = [
    { name: 'White-Label (Recommended)', desc: 'Deploy FLOW as your branded payment app with full features and revenue share' },
    { name: 'API Partner', desc: 'Provide API infrastructure for FLOW users with transaction fees' },
    { name: 'Pilot Program', desc: 'Start with 1,000 users, RM500 daily limit, no commitment' },
  ];
  
  models.forEach(model => {
    addText('> ' + model.name, margin, yPos, { fontSize: 11, fontStyle: 'bold' });
    yPos += 5;
    addText(model.desc, margin + 5, yPos, { fontSize: 9, color: COLORS.muted, maxWidth: pageWidth - margin * 2 - 10 });
    yPos += 12;
  });
  
  yPos += 5;
  
  // Next Steps
  yPos = addSection('Next Steps', yPos);
  yPos = addBullet('Technical deep-dive session (2 hours)', yPos);
  yPos = addBullet('Sandbox environment setup', yPos);
  yPos = addBullet('API integration proof-of-concept', yPos);
  yPos = addBullet('Pilot program agreement', yPos);
  
  // Contact footer
  yPos = pageHeight - 35;
  
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 20, 3, 3, 'F');
  
  addText('Contact: partners@flow.my', pageWidth / 2, yPos + 8, { fontSize: 10, color: COLORS.white, align: 'center' });
  addText('2025 FLOW Payment Orchestration', pageWidth / 2, yPos + 15, { fontSize: 8, color: COLORS.white, align: 'center' });
  
  addPageFooter(2);
  
  // Save the PDF
  doc.save('FLOW_Bank_Partnership_Summary.pdf');
}
