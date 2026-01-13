/**
 * FLOW Partner Pitch Deck PDF Generator
 * 
 * Generates a professional PDF summary for bank partners
 */

import { jsPDF } from 'jspdf';

// Colors (converted from HSL to RGB approximations)
const COLORS = {
  primary: [99, 102, 241] as [number, number, number],     // Indigo-ish primary
  text: [30, 30, 35] as [number, number, number],          // Dark text
  muted: [100, 100, 110] as [number, number, number],      // Muted text
  accent: [16, 185, 129] as [number, number, number],      // Teal accent
  background: [250, 250, 252] as [number, number, number], // Light background
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

  // Helper functions
  const addText = (text: string, x: number, y: number, options?: {
    fontSize?: number;
    color?: [number, number, number];
    fontStyle?: 'normal' | 'bold';
    maxWidth?: number;
  }) => {
    const { fontSize = 12, color = COLORS.text, fontStyle = 'normal', maxWidth } = options || {};
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    doc.setFont('helvetica', fontStyle);
    if (maxWidth) {
      doc.text(text, x, y, { maxWidth });
    } else {
      doc.text(text, x, y);
    }
  };

  const addSection = (title: string, y: number): number => {
    doc.setFillColor(...COLORS.primary);
    doc.rect(margin, y, 3, 8, 'F');
    addText(title, margin + 8, y + 6, { fontSize: 14, fontStyle: 'bold', color: COLORS.primary });
    return y + 15;
  };

  const addBullet = (text: string, y: number, indent: number = 0): number => {
    doc.setFillColor(...COLORS.accent);
    doc.circle(margin + indent + 2, y - 1.5, 1.5, 'F');
    addText(text, margin + indent + 8, y, { fontSize: 10, maxWidth: pageWidth - margin * 2 - indent - 10 });
    return y + 7;
  };

  // ==================== PAGE 1: Cover ====================
  
  // Header band
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text('FLOW', margin, 35);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Bank Partnership Proposal', margin, 48);
  
  yPos = 80;
  
  // Tagline
  addText('Unified Payment Orchestration for Malaysia', margin, yPos, {
    fontSize: 18,
    fontStyle: 'bold',
  });
  
  yPos += 15;
  addText(
    'Partner with FLOW to deliver seamless "Scan → Authorize → Pay" experiences across Malaysia\'s fragmented payment ecosystem.',
    margin,
    yPos,
    { fontSize: 11, color: COLORS.muted, maxWidth: pageWidth - margin * 2 }
  );
  
  yPos += 25;
  
  // Key Stats
  yPos = addSection('Key Metrics', yPos);
  
  const stats = [
    { value: '3M+', label: 'Potential Users' },
    { value: '40%', label: 'Higher Completion Rates' },
    { value: '<2s', label: 'Scan to Payment' },
    { value: 'Bank-grade', label: 'Security Level' },
  ];
  
  const statWidth = (pageWidth - margin * 2) / 4;
  stats.forEach((stat, i) => {
    const x = margin + (i * statWidth);
    addText(stat.value, x + statWidth / 2, yPos + 8, { fontSize: 16, fontStyle: 'bold', color: COLORS.primary });
    addText(stat.label, x + statWidth / 2, yPos + 15, { fontSize: 8, color: COLORS.muted });
  });
  
  yPos += 30;
  
  // Problem Statement
  yPos = addSection('The Problem', yPos);
  yPos = addBullet('Malaysia has 50+ payment apps - users juggle 3-5 daily', yPos);
  yPos = addBullet('Constant app switching, balance checking, failed payments', yPos);
  yPos = addBullet('No unified view of spending across wallets and banks', yPos);
  
  yPos += 10;
  
  // Solution
  yPos = addSection('FLOW Solution', yPos);
  yPos = addBullet('One scan works with any DuitNow QR - FLOW figures out the best way to pay', yPos);
  yPos = addBullet('Smart resolution engine checks balances, applies user preferences', yPos);
  yPos = addBullet('Biometric confirmation, then handoff to wallet for execution', yPos);
  yPos = addBullet('FLOW orchestrates, not holds money - zero regulatory friction', yPos);
  
  yPos += 10;
  
  // What We Need
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
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    doc.text(api, margin + 5, yPos);
    yPos += 6;
  });
  
  // ==================== PAGE 2: Technical Details ====================
  doc.addPage();
  yPos = margin;
  
  // Header
  addText('Technical Architecture', margin, yPos, { fontSize: 18, fontStyle: 'bold' });
  yPos += 15;
  
  // Architecture components
  yPos = addSection('Production-Ready Components', yPos);
  
  const components = [
    { name: 'Resolution Engine', status: '✓ Production Ready', desc: 'Rule-based payment routing with fallback logic' },
    { name: 'Security Layer', status: '✓ Production Ready', desc: '4-layer security: device, transport, application, transaction' },
    { name: 'Orchestration', status: '✓ Production Ready', desc: 'Intent → Plan → Execute flow with full state management' },
    { name: 'Bank Integration', status: '○ Spec Complete', desc: 'Open Banking compliant API specification ready' },
  ];
  
  components.forEach(comp => {
    addText(comp.name, margin, yPos, { fontSize: 11, fontStyle: 'bold' });
    addText(comp.status, pageWidth - margin - 40, yPos, { 
      fontSize: 9, 
      color: comp.status.includes('✓') ? COLORS.accent : COLORS.muted 
    });
    yPos += 5;
    addText(comp.desc, margin, yPos, { fontSize: 9, color: COLORS.muted });
    yPos += 10;
  });
  
  yPos += 5;
  
  // Security
  yPos = addSection('Security & Compliance', yPos);
  
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
  
  yPos += 10;
  
  // Partnership Models
  yPos = addSection('Partnership Models', yPos);
  
  const models = [
    { name: 'White-Label (Recommended)', desc: 'Deploy FLOW as your branded payment app with full features and revenue share' },
    { name: 'API Partner', desc: 'Provide API infrastructure for FLOW users with transaction fees' },
    { name: 'Pilot Program', desc: 'Start with 1,000 users, RM500 daily limit, no commitment' },
  ];
  
  models.forEach(model => {
    addText('• ' + model.name, margin, yPos, { fontSize: 11, fontStyle: 'bold' });
    yPos += 5;
    addText(model.desc, margin + 5, yPos, { fontSize: 9, color: COLORS.muted, maxWidth: pageWidth - margin * 2 - 10 });
    yPos += 10;
  });
  
  yPos += 10;
  
  // Next Steps
  yPos = addSection('Next Steps', yPos);
  yPos = addBullet('Technical deep-dive session (2 hours)', yPos);
  yPos = addBullet('Sandbox environment setup', yPos);
  yPos = addBullet('API integration proof-of-concept', yPos);
  yPos = addBullet('Pilot program agreement', yPos);
  
  // Footer
  yPos = pageHeight - 30;
  doc.setDrawColor(...COLORS.muted);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;
  
  addText('Contact: partners@flow.my', margin, yPos, { fontSize: 10, color: COLORS.muted });
  addText('© 2025 FLOW Payment Orchestration', pageWidth - margin - 60, yPos, { fontSize: 10, color: COLORS.muted });
  
  // Save the PDF
  doc.save('FLOW_Bank_Partnership_Summary.pdf');
}
