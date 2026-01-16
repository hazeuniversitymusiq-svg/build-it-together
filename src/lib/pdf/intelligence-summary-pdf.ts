/**
 * FLOW Intelligence Summary PDF Generator
 * 
 * Generates a professional PDF for investor presentations
 */

import { jsPDF } from 'jspdf';

// Colors (converted from HSL to RGB approximations)
const COLORS = {
  primary: [99, 102, 241] as [number, number, number],
  text: [30, 30, 35] as [number, number, number],
  muted: [100, 100, 110] as [number, number, number],
  accent: [16, 185, 129] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  background: [250, 250, 252] as [number, number, number],
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

  // Helper functions
  const addText = (text: string, x: number, y: number, options?: {
    fontSize?: number;
    color?: [number, number, number];
    fontStyle?: 'normal' | 'bold';
    maxWidth?: number;
    align?: 'left' | 'center' | 'right';
  }) => {
    const { fontSize = 12, color = COLORS.text, fontStyle = 'normal', maxWidth, align = 'left' } = options || {};
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    doc.setFont('helvetica', fontStyle);
    if (maxWidth) {
      doc.text(text, x, y, { maxWidth, align });
    } else {
      doc.text(text, x, y, { align });
    }
  };

  const addSection = (title: string, emoji: string, y: number): number => {
    doc.setFillColor(...COLORS.primary);
    doc.rect(margin, y, 3, 8, 'F');
    addText(`${emoji} ${title}`, margin + 8, y + 6, { fontSize: 14, fontStyle: 'bold', color: COLORS.primary });
    return y + 15;
  };

  const addBullet = (text: string, y: number, indent: number = 0): number => {
    doc.setFillColor(...COLORS.accent);
    doc.circle(margin + indent + 2, y - 1.5, 1.5, 'F');
    addText(text, margin + indent + 8, y, { fontSize: 10, maxWidth: pageWidth - margin * 2 - indent - 10 });
    return y + 7;
  };

  const addCheckmark = (text: string, y: number): number => {
    addText('✓', margin, y, { fontSize: 10, color: COLORS.accent, fontStyle: 'bold' });
    addText(text, margin + 8, y, { fontSize: 10, maxWidth: pageWidth - margin * 2 - 10 });
    return y + 7;
  };

  const addPageFooter = (pageNum: number) => {
    doc.setDrawColor(...COLORS.muted);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    addText(`FLOW Intelligence Summary`, margin, pageHeight - 10, { fontSize: 8, color: COLORS.muted });
    addText(`Page ${pageNum}`, pageWidth - margin, pageHeight - 10, { fontSize: 8, color: COLORS.muted, align: 'right' });
  };

  // ==================== PAGE 1: Cover ====================
  
  // Header band
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 65, 'F');
  
  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(42);
  doc.setFont('helvetica', 'bold');
  doc.text('FLOW', margin, 38);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Intelligence Summary', margin, 52);
  
  doc.setFontSize(10);
  doc.text('Investor Presentation | January 2026', margin, 62);
  
  yPos = 85;
  
  // Tagline box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos - 8, pageWidth - margin * 2, 25, 3, 3, 'F');
  
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
  
  addText(
    'FLOW is an intelligent payment orchestration layer that sits between users and their existing payment rails (TouchNGo, GrabPay, DuitNow, bank accounts). Instead of replacing wallets, FLOW unifies and optimizes how payments are made across all connected sources.',
    margin,
    yPos,
    { fontSize: 10, color: COLORS.muted, maxWidth: pageWidth - margin * 2 }
  );
  
  yPos += 25;
  
  // Key Stats
  const stats = [
    { value: '6', label: 'Payment Rails' },
    { value: '4', label: 'Intent Types' },
    { value: '5', label: 'Scoring Factors' },
    { value: '<100ms', label: 'Resolution' },
  ];
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos - 5, pageWidth - margin * 2, 30, 3, 3, 'F');
  
  const statWidth = (pageWidth - margin * 2) / 4;
  stats.forEach((stat, i) => {
    const x = margin + (i * statWidth) + statWidth / 2;
    addText(stat.value, x, yPos + 8, { fontSize: 18, fontStyle: 'bold', color: COLORS.primary, align: 'center' });
    addText(stat.label, x, yPos + 16, { fontSize: 8, color: COLORS.muted, align: 'center' });
  });
  
  yPos += 40;
  
  // Intelligence Modules Overview
  addText('Four Intelligence Modules', margin, yPos, { fontSize: 14, fontStyle: 'bold' });
  yPos += 12;
  
  const modules = [
    { emoji: '📷', name: 'Scan', desc: 'QR scanning with automatic rail optimization' },
    { emoji: '💸', name: 'Send', desc: 'P2P transfers with wallet discovery' },
    { emoji: '🧾', name: 'Bills', desc: 'Proactive management with auto-pay' },
    { emoji: '💳', name: 'FlowCard', desc: 'Virtual card with intelligent routing' },
  ];
  
  modules.forEach((mod) => {
    addText(`${mod.emoji} ${mod.name}`, margin, yPos, { fontSize: 11, fontStyle: 'bold' });
    addText(mod.desc, margin + 35, yPos, { fontSize: 10, color: COLORS.muted });
    yPos += 10;
  });
  
  yPos += 10;
  
  // Core Value
  addText('Core Value Proposition', margin, yPos, { fontSize: 14, fontStyle: 'bold' });
  yPos += 10;
  
  yPos = addBullet('Eliminates cognitive load of choosing payment methods', yPos);
  yPos = addBullet('Intelligent routing based on balance, compatibility, history', yPos);
  yPos = addBullet('Full transparency with explainable decisions', yPos);
  yPos = addBullet('Works with existing wallets - no replacement needed', yPos);
  
  addPageFooter(1);
  
  // ==================== PAGE 2: Scan & Send Intelligence ====================
  doc.addPage();
  yPos = margin;
  
  // Scan Intelligence
  yPos = addSection('Scan Intelligence', '📷', yPos);
  
  addText('QR code scanning with automatic payment rail optimization', margin, yPos, { fontSize: 10, color: COLORS.muted });
  yPos += 12;
  
  addText('Capabilities:', margin, yPos, { fontSize: 11, fontStyle: 'bold' });
  yPos += 8;
  
  yPos = addCheckmark('Multi-format QR parsing (EMVCo, DuitNow, TouchNGo)', yPos);
  yPos = addCheckmark('5-factor rail scoring algorithm', yPos);
  yPos = addCheckmark('Transaction history analysis (30-day window)', yPos);
  yPos = addCheckmark('Merchant compatibility verification', yPos);
  yPos = addCheckmark('Silent top-up detection with fallback source', yPos);
  yPos = addCheckmark('Human-readable explainability engine', yPos);
  
  yPos += 5;
  
  // Scoring breakdown
  addText('Scoring Algorithm:', margin, yPos, { fontSize: 11, fontStyle: 'bold' });
  yPos += 8;
  
  const scoring = [
    { factor: 'Compatibility', weight: '35%', desc: 'Merchant accepts rail' },
    { factor: 'Balance', weight: '30%', desc: 'Sufficient funds' },
    { factor: 'Priority', weight: '15%', desc: 'User preference' },
    { factor: 'History', weight: '10%', desc: 'Past success rate' },
    { factor: 'Health', weight: '10%', desc: 'Connector status' },
  ];
  
  scoring.forEach((s) => {
    addText(`${s.weight}`, margin, yPos, { fontSize: 9, fontStyle: 'bold', color: COLORS.primary });
    addText(`${s.factor}`, margin + 15, yPos, { fontSize: 9, fontStyle: 'bold' });
    addText(`- ${s.desc}`, margin + 45, yPos, { fontSize: 9, color: COLORS.muted });
    yPos += 6;
  });
  
  yPos += 10;
  
  // Send Intelligence
  yPos = addSection('Send Intelligence', '💸', yPos);
  
  addText('P2P transfers with recipient wallet discovery and smart suggestions', margin, yPos, { fontSize: 10, color: COLORS.muted });
  yPos += 12;
  
  addText('Capabilities:', margin, yPos, { fontSize: 11, fontStyle: 'bold' });
  yPos += 8;
  
  yPos = addCheckmark('Contact sync with wallet detection', yPos);
  yPos = addCheckmark('Frequent contact scoring (60% recency, 40% frequency)', yPos);
  yPos = addCheckmark('Smart amount suggestions from history', yPos);
  yPos = addCheckmark('Default wallet auto-selection per contact', yPos);
  yPos = addCheckmark('DuitNow universal fallback', yPos);
  yPos = addCheckmark('Complete contact send history', yPos);
  
  yPos += 8;
  
  // Example output
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 2, 2, 'F');
  
  yPos += 8;
  addText('Example Intelligence Output:', margin + 5, yPos, { fontSize: 9, fontStyle: 'bold', color: COLORS.primary });
  yPos += 7;
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.text);
  doc.text('Contact: Sarah | Send Count: 15 | Suggested: RM 50', margin + 5, yPos);
  yPos += 5;
  doc.text('Recommendation: "Send RM 50 via TouchNGo (used 12/15 times)"', margin + 5, yPos);
  
  yPos += 20;
  
  addPageFooter(2);
  
  // ==================== PAGE 3: Bills & FlowCard Intelligence ====================
  doc.addPage();
  yPos = margin;
  
  // Bills Intelligence
  yPos = addSection('Bills Intelligence', '🧾', yPos);
  
  addText('Proactive bill management with urgency detection and auto-pay', margin, yPos, { fontSize: 10, color: COLORS.muted });
  yPos += 12;
  
  addText('Capabilities:', margin, yPos, { fontSize: 11, fontStyle: 'bold' });
  yPos += 8;
  
  yPos = addCheckmark('Biller linking (Maxis, Unifi, TNB)', yPos);
  yPos = addCheckmark('Urgency detection (≤3 days = urgent)', yPos);
  yPos = addCheckmark('Proactive bill reminder surface on home', yPos);
  yPos = addCheckmark('One-tap PayBill intent creation', yPos);
  yPos = addCheckmark('Payment history with trend analysis', yPos);
  yPos = addCheckmark('Auto-pay toggle (3 days before due)', yPos);
  
  yPos += 12;
  
  // FlowCard Intelligence
  yPos = addSection('FlowCard Intelligence', '💳', yPos);
  
  addText('Virtual card with intelligent routing for tap-to-pay transactions', margin, yPos, { fontSize: 10, color: COLORS.muted });
  yPos += 12;
  
  addText('Capabilities:', margin, yPos, { fontSize: 11, fontStyle: 'bold' });
  yPos += 8;
  
  yPos = addCheckmark('Virtual Visa card generation (Luhn-valid)', yPos);
  yPos = addCheckmark('Card profile with device binding', yPos);
  yPos = addCheckmark('Terminal tap simulation', yPos);
  yPos = addCheckmark('Smart routing via resolution engine', yPos);
  yPos = addCheckmark('Explainability summary per transaction', yPos);
  yPos = addCheckmark('Pending event queue with approve/decline', yPos);
  yPos = addCheckmark('Apple/Google Pay provisioning stubs', yPos);
  yPos = addCheckmark('Instant suspend/reactivate control', yPos);
  
  yPos += 10;
  
  // FlowCard flow diagram
  addText('Transaction Flow:', margin, yPos, { fontSize: 11, fontStyle: 'bold' });
  yPos += 8;
  
  const flowSteps = [
    'Tap at Terminal',
    'FlowCard Intercepts',
    'Score Rails',
    'Select Best Source',
    'User Approves',
    'Execute'
  ];
  
  const stepWidth = (pageWidth - margin * 2 - 30) / flowSteps.length;
  flowSteps.forEach((step, i) => {
    const x = margin + (i * stepWidth) + stepWidth / 2;
    doc.setFillColor(...COLORS.primary);
    doc.circle(x, yPos + 5, 3, 'F');
    addText(step, x, yPos + 13, { fontSize: 7, color: COLORS.muted, align: 'center' });
    if (i < flowSteps.length - 1) {
      doc.setDrawColor(...COLORS.muted);
      doc.line(x + 5, yPos + 5, x + stepWidth - 5, yPos + 5);
    }
  });
  
  yPos += 30;
  
  addPageFooter(3);
  
  // ==================== PAGE 4: Technical & Business ====================
  doc.addPage();
  yPos = margin;
  
  // Smart Resolution Engine
  yPos = addSection('Smart Resolution Engine', '🧠', yPos);
  
  addText('Shared scoring engine across all intelligence modules', margin, yPos, { fontSize: 10, color: COLORS.muted });
  yPos += 12;
  
  // Algorithm steps
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 50, 2, 2, 'F');
  
  yPos += 8;
  const algorithmSteps = [
    '1. Fetch user\'s connected rails from database',
    '2. Fetch transaction history (30-day window)',
    '3. Score each rail across 5 factors',
    '4. Sort by total score descending',
    '5. Check if top-up needed from fallback source',
    '6. Generate human-readable explanation',
  ];
  
  algorithmSteps.forEach((step) => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    doc.text(step, margin + 5, yPos);
    yPos += 6;
  });
  
  yPos += 12;
  
  // Prototype vs Production
  addText('Prototype vs Production', margin, yPos, { fontSize: 14, fontStyle: 'bold' });
  yPos += 12;
  
  addText('✅ Complete for Prototype:', margin, yPos, { fontSize: 11, fontStyle: 'bold', color: COLORS.accent });
  yPos += 8;
  
  const prototypeComplete = [
    'Scan: Full UX flow, smart scoring, explainability',
    'Send: Contact sync, frequency scoring, suggestions',
    'Bills: Biller linking, urgency detection, trends',
    'FlowCard: Virtual card, tap simulation, routing',
  ];
  
  prototypeComplete.forEach((item) => {
    yPos = addBullet(item, yPos);
  });
  
  yPos += 8;
  
  addText('🏦 Requires Bank Partnership:', margin, yPos, { fontSize: 11, fontStyle: 'bold', color: COLORS.warning });
  yPos += 8;
  
  const bankRequired = [
    'Real-time balance API (currently DB cache)',
    'DuitNow Proxy Lookup for recipient discovery',
    'Card issuer license for real FlowCard',
    'Push Provisioning SDK for Apple/Google Pay',
    'PCI-DSS compliance for card data',
  ];
  
  bankRequired.forEach((item) => {
    yPos = addBullet(item, yPos);
  });
  
  yPos += 12;
  
  // Competitive Differentiators
  addText('Competitive Differentiators', margin, yPos, { fontSize: 14, fontStyle: 'bold' });
  yPos += 12;
  
  // Table header
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Feature', margin + 5, yPos + 5.5);
  doc.text('Single Wallet', margin + 60, yPos + 5.5);
  doc.text('Bank App', margin + 105, yPos + 5.5);
  doc.text('FLOW', margin + 145, yPos + 5.5);
  yPos += 8;
  
  const comparison = [
    ['Payment methods', '1', 'Own only', 'All connected'],
    ['Rail selection', 'None', 'Minimal', 'Intelligent'],
    ['Balance optimization', 'Manual', 'Limited', 'Automatic'],
    ['Explainability', 'None', 'None', 'Full transparency'],
  ];
  
  comparison.forEach((row, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, yPos, pageWidth - margin * 2, 7, 'F');
    }
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(row[0], margin + 5, yPos + 5);
    doc.text(row[1], margin + 60, yPos + 5);
    doc.text(row[2], margin + 105, yPos + 5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(row[3], margin + 145, yPos + 5);
    yPos += 7;
  });
  
  addPageFooter(4);
  
  // ==================== PAGE 5: Contact ====================
  doc.addPage();
  yPos = margin;
  
  // Database Architecture
  yPos = addSection('Database Architecture', '🗄️', yPos);
  
  const tables = [
    { name: 'intents', purpose: 'Payment requests with type, amount, payee' },
    { name: 'resolution_plans', purpose: 'Execution strategies with rail choices' },
    { name: 'transactions', purpose: 'Completed payments with status/receipt' },
    { name: 'funding_sources', purpose: 'Connected rails with balance/priority' },
    { name: 'connectors', purpose: 'App connections with capabilities' },
    { name: 'flow_card_profiles', purpose: 'Virtual card data and status' },
    { name: 'card_payment_events', purpose: 'Tap transactions with decisions' },
  ];
  
  tables.forEach((table) => {
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.primary);
    doc.text(table.name, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.text(`- ${table.purpose}`, margin + 50, yPos);
    yPos += 7;
  });
  
  yPos += 15;
  
  // Code Architecture
  yPos = addSection('Code Architecture', '📁', yPos);
  
  const codeStructure = [
    'lib/orchestration/smart-resolver.ts - Core scoring engine',
    'lib/qr/qr-to-intent.ts - QR parsing',
    'hooks/useSmartResolution.ts - React hook',
    'hooks/useFlowCard.ts - Virtual card management',
    'components/scanner/SmartRailRecommendation.tsx',
    'components/send/FrequentContacts.tsx',
    'components/bills/AutoPayToggle.tsx',
  ];
  
  codeStructure.forEach((file) => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.text);
    doc.text(file, margin, yPos);
    yPos += 6;
  });
  
  // Contact section at bottom
  yPos = pageHeight - 60;
  
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, yPos, pageWidth - margin * 2, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Ready to Partner?', pageWidth / 2, yPos + 12, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('partners@flow.my', pageWidth / 2, yPos + 22, { align: 'center' });
  
  doc.setFontSize(8);
  doc.text('See: FLOW_Bank_Partnership_API_Spec.md for technical integration details', pageWidth / 2, yPos + 32, { align: 'center' });
  
  addPageFooter(5);
  
  // Save the PDF
  doc.save('FLOW_Intelligence_Summary.pdf');
}
