/**
 * FLOW Partner Pitch Deck PDF Generator
 * 
 * Generates a professional PDF summary for bank partners
 * Clean ASCII-only output with proper spacing
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
    doc.rect(margin, y, 4, 7, 'F');
    addText(title, margin + 10, y + 5, { fontSize: 13, fontStyle: 'bold', color: COLORS.primary });
    return y + 12;
  };

  // Helper: Bullet point
  const addBullet = (text: string, y: number): number => {
    doc.setFillColor(...COLORS.accent);
    doc.circle(margin + 3, y - 1, 1.2, 'F');
    addText(text, margin + 9, y, { fontSize: 9, maxWidth: pageWidth - margin * 2 - 12 });
    return y + 6;
  };

  // ==================== PAGE 1: Cover ====================
  
  // Header band
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 55, 'F');
  
  addText('FLOW', margin, 32, { fontSize: 32, fontStyle: 'bold', color: COLORS.white });
  addText('Bank Partnership Proposal', margin, 44, { fontSize: 12, color: COLORS.white });
  
  yPos = 70;
  
  // Tagline
  addText('Unified Payment Orchestration for Malaysia', margin, yPos, { fontSize: 16, fontStyle: 'bold' });
  yPos += 10;
  
  addText(
    'Partner with FLOW to deliver seamless payment experiences across Malaysia\'s fragmented ecosystem.',
    margin, yPos,
    { fontSize: 10, color: COLORS.muted, maxWidth: pageWidth - margin * 2 }
  );
  
  yPos += 18;
  
  // Key Stats
  yPos = addSection('Key Metrics', yPos);
  
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, yPos - 3, pageWidth - margin * 2, 22, 2, 2, 'F');
  
  const stats = [
    { value: '3M+', label: 'Users' },
    { value: '40%', label: 'Better Rates' },
    { value: '<2s', label: 'Pay Time' },
    { value: 'Bank-grade', label: 'Security' },
  ];
  
  const statWidth = (pageWidth - margin * 2) / 4;
  stats.forEach((stat, i) => {
    const x = margin + (i * statWidth) + statWidth / 2;
    addText(stat.value, x, yPos + 6, { fontSize: 14, fontStyle: 'bold', color: COLORS.primary, align: 'center' });
    addText(stat.label, x, yPos + 12, { fontSize: 7, color: COLORS.muted, align: 'center' });
  });
  
  yPos += 28;
  
  // Problem
  yPos = addSection('The Problem', yPos);
  yPos = addBullet('Malaysia has 50+ payment apps - users juggle 3-5 daily', yPos);
  yPos = addBullet('Constant app switching, balance checking, failed payments', yPos);
  yPos = addBullet('No unified view of spending across wallets and banks', yPos);
  
  yPos += 6;
  
  // Solution
  yPos = addSection('FLOW Solution', yPos);
  yPos = addBullet('One scan works with any DuitNow QR - FLOW finds the best rail', yPos);
  yPos = addBullet('Smart resolution checks balances and applies preferences', yPos);
  yPos = addBullet('Biometric confirmation, then handoff to wallet', yPos);
  yPos = addBullet('FLOW orchestrates, never holds money - zero regulatory friction', yPos);
  
  yPos += 6;
  
  // Integration Requirements
  yPos = addSection('Integration Requirements', yPos);
  addText('4 API endpoints to power millions of payments:', margin, yPos, { fontSize: 9, color: COLORS.muted });
  yPos += 8;
  
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, yPos - 3, pageWidth - margin * 2, 28, 2, 2, 'F');
  
  const apis = [
    'GET  /accounts/{id}/balance',
    'POST /payments/initiate',
    'GET  /payments/{id}/status',
    'GET  /accounts/{id}/transactions',
  ];
  
  apis.forEach(api => {
    addText(api, margin + 5, yPos + 2, { fontSize: 8, font: 'courier' });
    yPos += 6;
  });
  
  // Footer
  yPos = pageHeight - 20;
  doc.setDrawColor(...COLORS.muted);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  addText('FLOW Bank Partnership  |  Page 1', margin, yPos + 8, { fontSize: 7, color: COLORS.muted });
  
  // ==================== PAGE 2 ====================
  doc.addPage();
  yPos = margin;
  
  addText('Technical Architecture', margin, yPos, { fontSize: 16, fontStyle: 'bold' });
  yPos += 12;
  
  // Components
  yPos = addSection('Production-Ready Components', yPos);
  
  const components = [
    { name: 'Resolution Engine', status: 'READY', desc: 'Rule-based payment routing with fallback logic' },
    { name: 'Security Layer', status: 'READY', desc: '4-layer security model' },
    { name: 'Orchestration', status: 'READY', desc: 'Intent-Plan-Execute flow with state management' },
    { name: 'Bank Integration', status: 'SPEC', desc: 'Open Banking compliant API specification' },
  ];
  
  components.forEach(comp => {
    doc.setFillColor(...COLORS.lightBg);
    doc.roundedRect(margin, yPos - 3, pageWidth - margin * 2, 12, 1, 1, 'F');
    
    addText(comp.name, margin + 3, yPos + 2, { fontSize: 10, fontStyle: 'bold' });
    
    const statusColor = comp.status === 'READY' ? COLORS.accent : COLORS.muted;
    addText(comp.status, pageWidth - margin - 18, yPos + 2, { fontSize: 8, color: statusColor, fontStyle: 'bold' });
    
    addText(comp.desc, margin + 3, yPos + 8, { fontSize: 8, color: COLORS.muted });
    yPos += 15;
  });
  
  yPos += 3;
  
  // Security
  yPos = addSection('Security and Compliance', yPos);
  
  const securityItems = [
    'OAuth 2.0 + PKCE authentication',
    'TLS 1.3 with certificate pinning',
    'HMAC transaction signing',
    'Tamper-evident audit logging',
    'PCI-DSS ready architecture',
    'PDPA compliant data handling',
  ];
  
  securityItems.forEach(item => {
    yPos = addBullet(item, yPos);
  });
  
  yPos += 6;
  
  // Partnership Models
  yPos = addSection('Partnership Models', yPos);
  
  const models = [
    { name: 'White-Label', desc: 'Your branded FLOW app with revenue share' },
    { name: 'API Partner', desc: 'Provide API infrastructure with transaction fees' },
    { name: 'Pilot Program', desc: '1,000 users, RM500 limit, no commitment' },
  ];
  
  models.forEach(model => {
    addText(model.name, margin, yPos, { fontSize: 10, fontStyle: 'bold', color: COLORS.primary });
    addText(model.desc, margin + 30, yPos, { fontSize: 9, color: COLORS.muted });
    yPos += 8;
  });
  
  yPos += 6;
  
  // Next Steps
  yPos = addSection('Next Steps', yPos);
  yPos = addBullet('Technical deep-dive session (2 hours)', yPos);
  yPos = addBullet('Sandbox environment setup', yPos);
  yPos = addBullet('API integration proof-of-concept', yPos);
  yPos = addBullet('Pilot program agreement', yPos);
  
  // Contact box
  yPos += 10;
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 18, 2, 2, 'F');
  
  addText('Contact: partners@flow.my', pageWidth / 2, yPos + 11, { fontSize: 11, fontStyle: 'bold', color: COLORS.white, align: 'center' });
  
  // Footer
  yPos = pageHeight - 20;
  doc.setDrawColor(...COLORS.muted);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  addText('FLOW Bank Partnership  |  Page 2', margin, yPos + 8, { fontSize: 7, color: COLORS.muted });
  
  // Save
  doc.save('FLOW_Bank_Partnership_Summary.pdf');
}
