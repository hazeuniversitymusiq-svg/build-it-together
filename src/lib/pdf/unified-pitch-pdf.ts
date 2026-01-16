/**
 * FLOW Unified Pitch Deck PDF Generator
 * 
 * Complete bank partner presentation combining
 * Partnership + Intelligence Summary in one polished document
 */

import { jsPDF } from 'jspdf';

// Colors (RGB)
const COLORS = {
  primary: [99, 102, 241] as [number, number, number],
  text: [30, 30, 35] as [number, number, number],
  muted: [100, 100, 110] as [number, number, number],
  accent: [16, 185, 129] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightBg: [248, 250, 252] as [number, number, number],
};

export function generateUnifiedPitchPDF(): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  let yPos = margin;

  // Helpers
  const addText = (text: string, x: number, y: number, options?: {
    fontSize?: number;
    color?: [number, number, number];
    fontStyle?: 'normal' | 'bold';
    maxWidth?: number;
    align?: 'left' | 'center' | 'right';
    font?: 'helvetica' | 'courier';
  }) => {
    const { fontSize = 12, color = COLORS.text, fontStyle = 'normal', maxWidth, align = 'left', font = 'helvetica' } = options || {};
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    doc.setFont(font, fontStyle);
    doc.text(text, x, y, maxWidth ? { maxWidth, align } : { align });
  };

  const addSection = (title: string, y: number): number => {
    doc.setFillColor(...COLORS.primary);
    doc.rect(margin, y, 4, 6, 'F');
    addText(title, margin + 9, y + 5, { fontSize: 12, fontStyle: 'bold', color: COLORS.primary });
    return y + 11;
  };

  const addBullet = (text: string, y: number): number => {
    doc.setFillColor(...COLORS.accent);
    doc.circle(margin + 3, y - 1, 1.2, 'F');
    addText(text, margin + 8, y, { fontSize: 9, maxWidth: pageWidth - margin * 2 - 12 });
    return y + 5.5;
  };

  const addFooter = (pageNum: number, total: number) => {
    doc.setDrawColor(...COLORS.muted);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    addText('FLOW Bank Partnership Pitch Deck', margin, pageHeight - 7, { fontSize: 7, color: COLORS.muted });
    addText('Page ' + pageNum + ' of ' + total, pageWidth - margin, pageHeight - 7, { fontSize: 7, color: COLORS.muted, align: 'right' });
  };

  // ==================== PAGE 1: Cover ====================
  
  // Full header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  addText('FLOW', margin, 40, { fontSize: 48, fontStyle: 'bold', color: COLORS.white });
  addText('Bank Partnership Pitch Deck', margin, 55, { fontSize: 16, color: COLORS.white });
  addText('Unified Payment Orchestration for Malaysia', margin, 68, { fontSize: 11, color: COLORS.white });
  
  yPos = 95;
  
  // Tagline box
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, yPos - 5, pageWidth - margin * 2, 20, 3, 3, 'F');
  addText('"One tap. Best rail. Every time."', pageWidth / 2, yPos + 5, {
    fontSize: 14, fontStyle: 'bold', color: COLORS.primary, align: 'center'
  });
  
  yPos += 28;
  
  // Key Stats
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, yPos - 3, pageWidth - margin * 2, 24, 2, 2, 'F');
  
  const stats = [
    { value: '3M+', label: 'Users' },
    { value: '40%', label: 'Better Rates' },
    { value: '<2s', label: 'Pay Time' },
    { value: '6 Rails', label: 'Connected' },
  ];
  
  const statWidth = (pageWidth - margin * 2) / 4;
  stats.forEach((stat, i) => {
    const x = margin + (i * statWidth) + statWidth / 2;
    addText(stat.value, x, yPos + 6, { fontSize: 16, fontStyle: 'bold', color: COLORS.primary, align: 'center' });
    addText(stat.label, x, yPos + 13, { fontSize: 8, color: COLORS.muted, align: 'center' });
  });
  
  yPos += 32;
  
  // Problem
  yPos = addSection('The Problem', yPos);
  yPos = addBullet('Malaysia has 50+ payment apps - users juggle 3-5 daily', yPos);
  yPos = addBullet('Constant app switching, balance checking, failed payments', yPos);
  yPos = addBullet('No unified view of spending across wallets and banks', yPos);
  
  yPos += 5;
  
  // Solution
  yPos = addSection('FLOW Solution', yPos);
  yPos = addBullet('One scan works with any DuitNow QR - FLOW finds the best rail', yPos);
  yPos = addBullet('Smart resolution checks balances and applies user preferences', yPos);
  yPos = addBullet('Biometric confirmation, then seamless handoff to wallet', yPos);
  yPos = addBullet('FLOW orchestrates, never holds money - zero regulatory friction', yPos);
  
  yPos += 5;
  
  // What we offer
  yPos = addSection('What We Offer', yPos);
  
  const offerings = [
    { label: 'Scan Intelligence', desc: 'QR scanning with automatic rail optimization' },
    { label: 'Send Intelligence', desc: 'P2P transfers with smart suggestions' },
    { label: 'Bills Intelligence', desc: 'Proactive management with auto-pay' },
    { label: 'FlowCard', desc: 'Virtual card with intelligent routing' },
  ];
  
  offerings.forEach(o => {
    addText(o.label, margin, yPos, { fontSize: 9, fontStyle: 'bold', color: COLORS.primary });
    addText(' - ' + o.desc, margin + 32, yPos, { fontSize: 9, color: COLORS.muted });
    yPos += 6;
  });
  
  addFooter(1, 4);
  
  // ==================== PAGE 2: Intelligence ====================
  doc.addPage();
  yPos = margin;
  
  addText('Intelligence Capabilities', margin, yPos, { fontSize: 16, fontStyle: 'bold' });
  yPos += 12;
  
  // Smart Resolution
  yPos = addSection('Smart Resolution Engine', yPos);
  addText('5-factor scoring algorithm shared across all modules:', margin, yPos, { fontSize: 9, color: COLORS.muted });
  yPos += 8;
  
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, yPos - 3, pageWidth - margin * 2, 32, 2, 2, 'F');
  
  const scoring = [
    { weight: '35%', factor: 'Compatibility', desc: 'Merchant accepts rail' },
    { weight: '30%', factor: 'Balance', desc: 'Sufficient funds available' },
    { weight: '15%', factor: 'Priority', desc: 'User preference order' },
    { weight: '10%', factor: 'History', desc: 'Past success rate' },
    { weight: '10%', factor: 'Health', desc: 'Connector status' },
  ];
  
  scoring.forEach(s => {
    addText(s.weight, margin + 4, yPos + 2, { fontSize: 9, fontStyle: 'bold', color: COLORS.primary });
    addText(s.factor, margin + 18, yPos + 2, { fontSize: 9, fontStyle: 'bold' });
    addText(s.desc, margin + 48, yPos + 2, { fontSize: 8, color: COLORS.muted });
    yPos += 6;
  });
  
  yPos += 8;
  
  // Scan
  yPos = addSection('Scan Intelligence', yPos);
  yPos = addBullet('Multi-format QR parsing (EMVCo, DuitNow, TouchNGo)', yPos);
  yPos = addBullet('Real-time rail scoring with explainability', yPos);
  yPos = addBullet('Silent top-up detection with fallback source', yPos);
  yPos = addBullet('Transaction history analysis (30-day window)', yPos);
  
  yPos += 4;
  
  // Send
  yPos = addSection('Send Intelligence', yPos);
  yPos = addBullet('Contact sync with wallet detection per recipient', yPos);
  yPos = addBullet('Frequent contact scoring (60% recency, 40% frequency)', yPos);
  yPos = addBullet('Smart amount suggestions from transfer history', yPos);
  yPos = addBullet('DuitNow universal fallback for any recipient', yPos);
  
  yPos += 4;
  
  // Bills
  yPos = addSection('Bills Intelligence', yPos);
  yPos = addBullet('Biller linking (Maxis, Unifi, TNB)', yPos);
  yPos = addBullet('Urgency detection (3 days or less = urgent)', yPos);
  yPos = addBullet('Payment history with trend analysis', yPos);
  yPos = addBullet('Auto-pay toggle (triggers 3 days before due)', yPos);
  
  yPos += 4;
  
  // FlowCard
  yPos = addSection('FlowCard Intelligence', yPos);
  yPos = addBullet('Virtual Visa card with Luhn-valid numbers', yPos);
  yPos = addBullet('Tap-to-pay with smart routing via resolution engine', yPos);
  yPos = addBullet('Explainability summary per transaction', yPos);
  yPos = addBullet('Instant suspend/reactivate control', yPos);
  
  addFooter(2, 4);
  
  // ==================== PAGE 3: Technical ====================
  doc.addPage();
  yPos = margin;
  
  addText('Technical Architecture', margin, yPos, { fontSize: 16, fontStyle: 'bold' });
  yPos += 12;
  
  // Components
  yPos = addSection('Production-Ready Components', yPos);
  
  const components = [
    { name: 'Resolution Engine', status: 'READY', desc: 'Rule-based payment routing with fallback logic' },
    { name: 'Security Layer', status: 'READY', desc: '4-layer security: device, transport, app, transaction' },
    { name: 'Orchestration', status: 'READY', desc: 'Intent-Plan-Execute flow with state management' },
    { name: 'Bank Integration', status: 'SPEC', desc: 'Open Banking compliant API specification' },
  ];
  
  components.forEach(comp => {
    doc.setFillColor(...COLORS.lightBg);
    doc.roundedRect(margin, yPos - 2, pageWidth - margin * 2, 11, 1, 1, 'F');
    
    addText(comp.name, margin + 3, yPos + 2, { fontSize: 9, fontStyle: 'bold' });
    const statusColor = comp.status === 'READY' ? COLORS.accent : COLORS.warning;
    addText(comp.status, pageWidth - margin - 15, yPos + 2, { fontSize: 8, color: statusColor, fontStyle: 'bold' });
    addText(comp.desc, margin + 3, yPos + 7, { fontSize: 8, color: COLORS.muted });
    yPos += 14;
  });
  
  yPos += 2;
  
  // Security
  yPos = addSection('Security and Compliance', yPos);
  
  const security = [
    'OAuth 2.0 + PKCE authentication',
    'TLS 1.3 with certificate pinning',
    'HMAC transaction signing',
    'Tamper-evident audit logging',
    'PCI-DSS ready architecture',
    'PDPA compliant data handling',
  ];
  
  security.forEach(item => {
    yPos = addBullet(item, yPos);
  });
  
  yPos += 5;
  
  // Database
  yPos = addSection('Database Architecture', yPos);
  
  const tables = [
    { name: 'intents', desc: 'Payment requests with type, amount, payee' },
    { name: 'resolution_plans', desc: 'Chosen rails and execution strategies' },
    { name: 'funding_sources', desc: 'Connected rails with balance/priority' },
    { name: 'flow_card_profiles', desc: 'Virtual card data and device binding' },
  ];
  
  tables.forEach(t => {
    addText(t.name, margin, yPos, { fontSize: 8, fontStyle: 'bold', color: COLORS.primary, font: 'courier' });
    addText(' - ' + t.desc, margin + 38, yPos, { fontSize: 8, color: COLORS.muted });
    yPos += 5.5;
  });
  
  yPos += 5;
  
  // Prototype vs Production
  yPos = addSection('Prototype vs Production', yPos);
  
  addText('Complete for prototype:', margin, yPos, { fontSize: 9, fontStyle: 'bold', color: COLORS.accent });
  yPos += 6;
  addText('Full UX flows, smart scoring, explainability, virtual card simulation', margin, yPos, { fontSize: 8, color: COLORS.muted });
  
  yPos += 8;
  addText('Requires bank partnership:', margin, yPos, { fontSize: 9, fontStyle: 'bold', color: COLORS.warning });
  yPos += 6;
  addText('Real-time balance API, DuitNow Proxy, card issuer license, PCI-DSS', margin, yPos, { fontSize: 8, color: COLORS.muted });
  
  addFooter(3, 4);
  
  // ==================== PAGE 4: Partnership ====================
  doc.addPage();
  yPos = margin;
  
  addText('Partnership Opportunity', margin, yPos, { fontSize: 16, fontStyle: 'bold' });
  yPos += 12;
  
  // Integration Requirements
  yPos = addSection('Integration Requirements', yPos);
  addText('Just 4 API endpoints to power millions of payments:', margin, yPos, { fontSize: 9, color: COLORS.muted });
  yPos += 8;
  
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, yPos - 3, pageWidth - margin * 2, 26, 2, 2, 'F');
  
  const apis = [
    'GET  /accounts/{id}/balance        - Real-time balance inquiry',
    'POST /payments/initiate            - Initiate payment',
    'GET  /payments/{id}/status         - Check payment status',
    'GET  /accounts/{id}/transactions   - Transaction history',
  ];
  
  apis.forEach(api => {
    addText(api, margin + 4, yPos + 2, { fontSize: 8, font: 'courier' });
    yPos += 6;
  });
  
  yPos += 8;
  
  // Partnership Models
  yPos = addSection('Partnership Models', yPos);
  
  const models = [
    { name: 'White-Label', tag: 'RECOMMENDED', desc: 'Your branded FLOW app with full features and revenue share' },
    { name: 'API Partner', tag: '', desc: 'Provide API infrastructure for FLOW users with transaction fees' },
    { name: 'Pilot Program', tag: '', desc: '1,000 users, RM500 daily limit, no commitment to start' },
  ];
  
  models.forEach(m => {
    doc.setFillColor(...COLORS.lightBg);
    doc.roundedRect(margin, yPos - 2, pageWidth - margin * 2, 14, 1, 1, 'F');
    
    addText(m.name, margin + 3, yPos + 3, { fontSize: 10, fontStyle: 'bold', color: COLORS.primary });
    if (m.tag) {
      addText(m.tag, margin + 32, yPos + 3, { fontSize: 7, color: COLORS.accent, fontStyle: 'bold' });
    }
    addText(m.desc, margin + 3, yPos + 9, { fontSize: 8, color: COLORS.muted });
    yPos += 17;
  });
  
  yPos += 3;
  
  // Next Steps
  yPos = addSection('Next Steps', yPos);
  yPos = addBullet('Technical deep-dive session (2 hours)', yPos);
  yPos = addBullet('Sandbox environment setup', yPos);
  yPos = addBullet('API integration proof-of-concept', yPos);
  yPos = addBullet('Pilot program agreement', yPos);
  
  // Contact box
  yPos += 8;
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 28, 3, 3, 'F');
  
  addText('Ready to Partner?', pageWidth / 2, yPos + 10, { fontSize: 14, fontStyle: 'bold', color: COLORS.white, align: 'center' });
  addText('partners@flow.my', pageWidth / 2, yPos + 18, { fontSize: 11, color: COLORS.white, align: 'center' });
  addText('Technical spec: FLOW_Bank_Partnership_API_Spec.md', pageWidth / 2, yPos + 24, { fontSize: 8, color: COLORS.white, align: 'center' });
  
  addFooter(4, 4);
  
  // Save
  doc.save('FLOW_Pitch_Deck.pdf');
}
