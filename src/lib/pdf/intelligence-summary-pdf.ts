/**
 * FLOW Intelligence Summary PDF Generator
 * 
 * Generates a professional PDF for investor presentations
 * Uses only ASCII characters for maximum compatibility
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

export function generateIntelligenceSummaryPDF(): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Helper: Add text with options
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

  // Helper: Add section header with colored bar
  const addSection = (title: string, y: number): number => {
    doc.setFillColor(...COLORS.primary);
    doc.rect(margin, y, 4, 8, 'F');
    addText(title, margin + 10, y + 6, { fontSize: 14, fontStyle: 'bold', color: COLORS.primary });
    return y + 15;
  };

  // Helper: Add bullet point
  const addBullet = (text: string, y: number, indent: number = 0): number => {
    doc.setFillColor(...COLORS.accent);
    doc.circle(margin + indent + 3, y - 1.5, 1.5, 'F');
    addText(text, margin + indent + 10, y, { fontSize: 10, maxWidth: pageWidth - margin * 2 - indent - 15 });
    return y + 7;
  };

  // Helper: Add checkmark item
  const addCheckItem = (text: string, y: number): number => {
    doc.setFillColor(...COLORS.accent);
    doc.circle(margin + 3, y - 1.5, 2, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('>', margin + 1.5, y - 0.5);
    addText(text, margin + 10, y, { fontSize: 10, maxWidth: pageWidth - margin * 2 - 15 });
    return y + 7;
  };

  // Helper: Add page footer
  const addPageFooter = (pageNum: number) => {
    doc.setDrawColor(...COLORS.muted);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    addText('FLOW Intelligence Summary', margin, pageHeight - 10, { fontSize: 8, color: COLORS.muted });
    addText('Page ' + pageNum, pageWidth - margin, pageHeight - 10, { fontSize: 8, color: COLORS.muted, align: 'right' });
  };

  // ==================== PAGE 1: Cover ====================
  
  // Header band
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 65, 'F');
  
  // Logo and title
  addText('FLOW', margin, 38, { fontSize: 42, fontStyle: 'bold', color: COLORS.white });
  addText('Intelligence Summary', margin, 52, { fontSize: 16, color: COLORS.white });
  addText('Investor Presentation  |  January 2026', margin, 62, { fontSize: 10, color: COLORS.white });
  
  yPos = 85;
  
  // Tagline box
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, yPos - 8, pageWidth - margin * 2, 22, 3, 3, 'F');
  addText('"One tap. Best rail. Every time."', pageWidth / 2, yPos + 3, {
    fontSize: 16,
    fontStyle: 'bold',
    color: COLORS.primary,
    align: 'center'
  });
  
  yPos += 30;
  
  // Executive Summary
  addText('Executive Summary', margin, yPos, { fontSize: 14, fontStyle: 'bold' });
  yPos += 10;
  
  const summaryText = 'FLOW is an intelligent payment orchestration layer that sits between users and their existing payment rails (TouchNGo, GrabPay, DuitNow, bank accounts). Instead of replacing wallets, FLOW unifies and optimizes how payments are made across all connected sources.';
  addText(summaryText, margin, yPos, { fontSize: 10, color: COLORS.muted, maxWidth: pageWidth - margin * 2 });
  
  yPos += 22;
  
  // Key Stats
  const stats = [
    { value: '6', label: 'Payment Rails' },
    { value: '4', label: 'Intent Types' },
    { value: '5', label: 'Scoring Factors' },
    { value: '<100ms', label: 'Resolution Time' },
  ];
  
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, yPos - 5, pageWidth - margin * 2, 28, 3, 3, 'F');
  
  const statWidth = (pageWidth - margin * 2) / 4;
  stats.forEach((stat, i) => {
    const x = margin + (i * statWidth) + statWidth / 2;
    addText(stat.value, x, yPos + 7, { fontSize: 18, fontStyle: 'bold', color: COLORS.primary, align: 'center' });
    addText(stat.label, x, yPos + 15, { fontSize: 8, color: COLORS.muted, align: 'center' });
  });
  
  yPos += 40;
  
  // Intelligence Modules Overview
  addText('Four Intelligence Modules', margin, yPos, { fontSize: 14, fontStyle: 'bold' });
  yPos += 12;
  
  const modules = [
    { tag: '[SCAN]', name: 'Scan Intelligence', desc: 'QR scanning with automatic rail optimization' },
    { tag: '[SEND]', name: 'Send Intelligence', desc: 'P2P transfers with wallet discovery' },
    { tag: '[BILLS]', name: 'Bills Intelligence', desc: 'Proactive management with auto-pay' },
    { tag: '[CARD]', name: 'FlowCard Intelligence', desc: 'Virtual card with intelligent routing' },
  ];
  
  modules.forEach((mod) => {
    addText(mod.tag, margin, yPos, { fontSize: 9, fontStyle: 'bold', color: COLORS.primary, font: 'courier' });
    addText(mod.name, margin + 22, yPos, { fontSize: 10, fontStyle: 'bold' });
    addText(' - ' + mod.desc, margin + 58, yPos, { fontSize: 10, color: COLORS.muted });
    yPos += 9;
  });
  
  yPos += 8;
  
  // Core Value
  addText('Core Value Proposition', margin, yPos, { fontSize: 14, fontStyle: 'bold' });
  yPos += 10;
  
  yPos = addBullet('Eliminates cognitive load of choosing payment methods', yPos);
  yPos = addBullet('Intelligent routing based on balance, compatibility, history', yPos);
  yPos = addBullet('Full transparency with explainable decisions', yPos);
  yPos = addBullet('Works with existing wallets - no replacement needed', yPos);
  
  addPageFooter(1);
  
  // ==================== PAGE 2: Scan & Send ====================
  doc.addPage();
  yPos = margin;
  
  // Scan Intelligence
  yPos = addSection('Scan Intelligence', yPos);
  
  addText('QR code scanning with automatic payment rail optimization', margin, yPos, { fontSize: 10, color: COLORS.muted });
  yPos += 12;
  
  addText('Capabilities:', margin, yPos, { fontSize: 11, fontStyle: 'bold' });
  yPos += 8;
  
  yPos = addCheckItem('Multi-format QR parsing (EMVCo, DuitNow, TouchNGo)', yPos);
  yPos = addCheckItem('5-factor rail scoring algorithm', yPos);
  yPos = addCheckItem('Transaction history analysis (30-day window)', yPos);
  yPos = addCheckItem('Merchant compatibility verification', yPos);
  yPos = addCheckItem('Silent top-up detection with fallback source', yPos);
  yPos = addCheckItem('Human-readable explainability engine', yPos);
  
  yPos += 5;
  
  // Scoring breakdown
  addText('Scoring Algorithm:', margin, yPos, { fontSize: 11, fontStyle: 'bold' });
  yPos += 10;
  
  // Draw scoring table
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, yPos - 4, pageWidth - margin * 2, 40, 2, 2, 'F');
  
  const scoring = [
    { factor: 'Compatibility', weight: '35%', desc: 'Merchant accepts rail + required capability' },
    { factor: 'Balance', weight: '30%', desc: 'Sufficient funds available' },
    { factor: 'Priority', weight: '15%', desc: 'User preference order' },
    { factor: 'History', weight: '10%', desc: 'Past success rate at merchant' },
    { factor: 'Health', weight: '10%', desc: 'Connector availability status' },
  ];
  
  scoring.forEach((s) => {
    addText(s.weight, margin + 5, yPos, { fontSize: 10, fontStyle: 'bold', color: COLORS.primary });
    addText(s.factor, margin + 22, yPos, { fontSize: 10, fontStyle: 'bold' });
    addText(s.desc, margin + 55, yPos, { fontSize: 9, color: COLORS.muted });
    yPos += 7;
  });
  
  yPos += 10;
  
  // Send Intelligence
  yPos = addSection('Send Intelligence', yPos);
  
  addText('P2P transfers with recipient wallet discovery and smart suggestions', margin, yPos, { fontSize: 10, color: COLORS.muted });
  yPos += 12;
  
  addText('Capabilities:', margin, yPos, { fontSize: 11, fontStyle: 'bold' });
  yPos += 8;
  
  yPos = addCheckItem('Contact sync with wallet detection', yPos);
  yPos = addCheckItem('Frequent contact scoring (60% recency, 40% frequency)', yPos);
  yPos = addCheckItem('Smart amount suggestions from transfer history', yPos);
  yPos = addCheckItem('Default wallet auto-selection per contact', yPos);
  yPos = addCheckItem('DuitNow universal fallback', yPos);
  yPos = addCheckItem('Complete contact send history with analytics', yPos);
  
  yPos += 8;
  
  // Example output box
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 28, 2, 2, 'F');
  
  yPos += 8;
  addText('Example Intelligence Output:', margin + 5, yPos, { fontSize: 9, fontStyle: 'bold', color: COLORS.primary });
  yPos += 8;
  addText('Contact: Sarah  |  Send Count: 15  |  Suggested Amount: RM 50', margin + 5, yPos, { fontSize: 9, font: 'courier' });
  yPos += 6;
  addText('Recommendation: "Send RM 50 via TouchNGo (used 12 of 15 times)"', margin + 5, yPos, { fontSize: 9, font: 'courier' });
  
  yPos += 18;
  
  addPageFooter(2);
  
  // ==================== PAGE 3: Bills & FlowCard ====================
  doc.addPage();
  yPos = margin;
  
  // Bills Intelligence
  yPos = addSection('Bills Intelligence', yPos);
  
  addText('Proactive bill management with urgency detection and auto-pay', margin, yPos, { fontSize: 10, color: COLORS.muted });
  yPos += 12;
  
  addText('Capabilities:', margin, yPos, { fontSize: 11, fontStyle: 'bold' });
  yPos += 8;
  
  yPos = addCheckItem('Biller linking (Maxis, Unifi, TNB)', yPos);
  yPos = addCheckItem('Urgency detection (3 days or less = urgent)', yPos);
  yPos = addCheckItem('Proactive bill reminder surface on home screen', yPos);
  yPos = addCheckItem('One-tap PayBill intent creation', yPos);
  yPos = addCheckItem('Payment history with trend analysis', yPos);
  yPos = addCheckItem('Auto-pay toggle (triggers 3 days before due)', yPos);
  
  yPos += 12;
  
  // FlowCard Intelligence
  yPos = addSection('FlowCard Intelligence', yPos);
  
  addText('Virtual card with intelligent routing for tap-to-pay transactions', margin, yPos, { fontSize: 10, color: COLORS.muted });
  yPos += 12;
  
  addText('Capabilities:', margin, yPos, { fontSize: 11, fontStyle: 'bold' });
  yPos += 8;
  
  yPos = addCheckItem('Virtual Visa card generation (Luhn-valid numbers)', yPos);
  yPos = addCheckItem('Card profile with secure device binding', yPos);
  yPos = addCheckItem('Terminal tap simulation for demos', yPos);
  yPos = addCheckItem('Smart routing via shared resolution engine', yPos);
  yPos = addCheckItem('Explainability summary per transaction', yPos);
  yPos = addCheckItem('Pending event queue with approve/decline actions', yPos);
  yPos = addCheckItem('Apple Pay / Google Pay provisioning stubs', yPos);
  yPos = addCheckItem('Instant suspend/reactivate card control', yPos);
  
  yPos += 10;
  
  // Transaction Flow
  addText('Transaction Flow:', margin, yPos, { fontSize: 11, fontStyle: 'bold' });
  yPos += 10;
  
  // Draw flow diagram
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, yPos - 2, pageWidth - margin * 2, 20, 2, 2, 'F');
  
  const flowSteps = ['Tap Terminal', 'Intercept', 'Score Rails', 'Select Source', 'Approve', 'Execute'];
  const stepWidth = (pageWidth - margin * 2 - 20) / flowSteps.length;
  
  flowSteps.forEach((step, i) => {
    const x = margin + 10 + (i * stepWidth) + stepWidth / 2;
    
    // Circle
    doc.setFillColor(...COLORS.primary);
    doc.circle(x, yPos + 6, 3, 'F');
    
    // Step number
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(String(i + 1), x - 1.2, yPos + 7.5);
    
    // Label
    addText(step, x, yPos + 14, { fontSize: 7, color: COLORS.muted, align: 'center' });
    
    // Arrow
    if (i < flowSteps.length - 1) {
      doc.setDrawColor(...COLORS.muted);
      doc.setLineWidth(0.5);
      doc.line(x + 5, yPos + 6, x + stepWidth - 5, yPos + 6);
      // Arrowhead
      doc.line(x + stepWidth - 7, yPos + 4.5, x + stepWidth - 5, yPos + 6);
      doc.line(x + stepWidth - 7, yPos + 7.5, x + stepWidth - 5, yPos + 6);
    }
  });
  
  yPos += 30;
  
  addPageFooter(3);
  
  // ==================== PAGE 4: Technical & Business ====================
  doc.addPage();
  yPos = margin;
  
  // Smart Resolution Engine
  yPos = addSection('Smart Resolution Engine', yPos);
  
  addText('Shared scoring engine across all four intelligence modules', margin, yPos, { fontSize: 10, color: COLORS.muted });
  yPos += 12;
  
  // Algorithm steps box
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, yPos - 2, pageWidth - margin * 2, 48, 2, 2, 'F');
  
  yPos += 5;
  const algorithmSteps = [
    'Step 1: Fetch user\'s connected rails from database',
    'Step 2: Fetch transaction history (30-day window)',
    'Step 3: Score each rail across 5 weighted factors',
    'Step 4: Sort rails by total score descending',
    'Step 5: Check if top-up needed from fallback source',
    'Step 6: Generate human-readable explanation',
  ];
  
  algorithmSteps.forEach((step) => {
    addText(step, margin + 5, yPos, { fontSize: 9, font: 'courier' });
    yPos += 7;
  });
  
  yPos += 10;
  
  // Prototype vs Production
  addText('Prototype vs Production Readiness', margin, yPos, { fontSize: 14, fontStyle: 'bold' });
  yPos += 12;
  
  // Complete section
  doc.setFillColor(...COLORS.accent);
  doc.circle(margin + 3, yPos - 1, 2, 'F');
  addText('Complete for Prototype:', margin + 10, yPos, { fontSize: 11, fontStyle: 'bold', color: COLORS.accent });
  yPos += 8;
  
  const prototypeComplete = [
    'Scan: Full UX flow, smart scoring, explainability',
    'Send: Contact sync, frequency scoring, amount suggestions',
    'Bills: Biller linking, urgency detection, trend analysis',
    'FlowCard: Virtual card, tap simulation, routing integration',
  ];
  
  prototypeComplete.forEach((item) => {
    addText('  - ' + item, margin, yPos, { fontSize: 9 });
    yPos += 6;
  });
  
  yPos += 6;
  
  // Bank required section
  doc.setFillColor(...COLORS.warning);
  doc.circle(margin + 3, yPos - 1, 2, 'F');
  addText('Requires Bank Partnership:', margin + 10, yPos, { fontSize: 11, fontStyle: 'bold', color: COLORS.warning });
  yPos += 8;
  
  const bankRequired = [
    'Real-time balance API (currently uses database cache)',
    'DuitNow Proxy Lookup for recipient wallet discovery',
    'Card issuer license for real FlowCard (Visa/Mastercard)',
    'Push Provisioning SDK for Apple Pay / Google Pay',
    'PCI-DSS compliance for card data handling',
  ];
  
  bankRequired.forEach((item) => {
    addText('  - ' + item, margin, yPos, { fontSize: 9 });
    yPos += 6;
  });
  
  yPos += 10;
  
  // Competitive Differentiators
  addText('Competitive Differentiators', margin, yPos, { fontSize: 14, fontStyle: 'bold' });
  yPos += 12;
  
  // Table header
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
  addText('Feature', margin + 5, yPos + 5.5, { fontSize: 9, fontStyle: 'bold', color: COLORS.white });
  addText('Single Wallet', margin + 55, yPos + 5.5, { fontSize: 9, fontStyle: 'bold', color: COLORS.white });
  addText('Bank App', margin + 100, yPos + 5.5, { fontSize: 9, fontStyle: 'bold', color: COLORS.white });
  addText('FLOW', margin + 140, yPos + 5.5, { fontSize: 9, fontStyle: 'bold', color: COLORS.white });
  yPos += 8;
  
  const comparison = [
    ['Payment methods', '1 only', 'Own bank only', 'All connected'],
    ['Rail selection', 'None', 'Minimal', 'Intelligent'],
    ['Balance optimization', 'Manual', 'Limited', 'Automatic'],
    ['Explainability', 'None', 'None', 'Full transparency'],
  ];
  
  comparison.forEach((row, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...COLORS.lightBg);
      doc.rect(margin, yPos, pageWidth - margin * 2, 7, 'F');
    }
    addText(row[0], margin + 5, yPos + 5, { fontSize: 8 });
    addText(row[1], margin + 55, yPos + 5, { fontSize: 8, color: COLORS.muted });
    addText(row[2], margin + 100, yPos + 5, { fontSize: 8, color: COLORS.muted });
    addText(row[3], margin + 140, yPos + 5, { fontSize: 8, fontStyle: 'bold', color: COLORS.primary });
    yPos += 7;
  });
  
  addPageFooter(4);
  
  // ==================== PAGE 5: Architecture & Contact ====================
  doc.addPage();
  yPos = margin;
  
  // Database Architecture
  yPos = addSection('Database Architecture', yPos);
  
  addText('Core Tables:', margin, yPos, { fontSize: 11, fontStyle: 'bold' });
  yPos += 10;
  
  const tables = [
    { name: 'intents', purpose: 'Payment requests with type, amount, payee' },
    { name: 'resolution_plans', purpose: 'Execution strategies with chosen rails' },
    { name: 'transactions', purpose: 'Completed payments with status and receipts' },
    { name: 'funding_sources', purpose: 'Connected rails with balance and priority' },
    { name: 'connectors', purpose: 'App connections with capabilities' },
    { name: 'flow_card_profiles', purpose: 'Virtual card data and device binding' },
    { name: 'card_payment_events', purpose: 'Tap transactions with routing decisions' },
  ];
  
  tables.forEach((table) => {
    addText(table.name, margin, yPos, { fontSize: 9, fontStyle: 'bold', color: COLORS.primary, font: 'courier' });
    addText(' - ' + table.purpose, margin + 48, yPos, { fontSize: 9, color: COLORS.muted });
    yPos += 7;
  });
  
  yPos += 10;
  
  // Code Architecture
  yPos = addSection('Code Architecture', yPos);
  
  addText('Key Files:', margin, yPos, { fontSize: 11, fontStyle: 'bold' });
  yPos += 10;
  
  const codeFiles = [
    'lib/orchestration/smart-resolver.ts    - Core scoring engine',
    'lib/qr/qr-to-intent.ts                 - QR parsing logic',
    'hooks/useSmartResolution.ts            - React hook for scoring',
    'hooks/useFlowCard.ts                   - Virtual card management',
    'components/scanner/SmartRailRecommendation.tsx',
    'components/send/FrequentContacts.tsx',
    'components/bills/AutoPayToggle.tsx',
  ];
  
  codeFiles.forEach((file) => {
    addText(file, margin, yPos, { fontSize: 8, font: 'courier' });
    yPos += 6;
  });
  
  yPos += 10;
  
  // Intent Types
  yPos = addSection('Intent Types', yPos);
  
  const intentTypes = [
    { type: 'PayMerchant', desc: 'QR scan payments to merchants' },
    { type: 'SendMoney', desc: 'P2P transfers to contacts' },
    { type: 'RequestMoney', desc: 'Payment requests from others' },
    { type: 'PayBill', desc: 'Utility and service bill payments' },
  ];
  
  intentTypes.forEach((intent) => {
    addText(intent.type, margin, yPos, { fontSize: 10, fontStyle: 'bold', color: COLORS.primary });
    addText(' - ' + intent.desc, margin + 35, yPos, { fontSize: 10, color: COLORS.muted });
    yPos += 7;
  });
  
  // Contact section at bottom
  yPos = pageHeight - 55;
  
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 38, 3, 3, 'F');
  
  addText('Ready to Partner?', pageWidth / 2, yPos + 12, { fontSize: 16, fontStyle: 'bold', color: COLORS.white, align: 'center' });
  addText('partners@flow.my', pageWidth / 2, yPos + 22, { fontSize: 11, color: COLORS.white, align: 'center' });
  addText('See: FLOW_Bank_Partnership_API_Spec.md for technical integration details', pageWidth / 2, yPos + 32, { fontSize: 8, color: COLORS.white, align: 'center' });
  
  addPageFooter(5);
  
  // Save the PDF
  doc.save('FLOW_Intelligence_Summary.pdf');
}
