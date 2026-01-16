# FLOW Intelligence Summary
## Comprehensive Payment Orchestration Capabilities

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Prototype Complete

---

## Executive Summary

FLOW is an intelligent payment orchestration layer that sits between users and their existing payment rails (TouchNGo, GrabPay, DuitNow, bank accounts). Instead of replacing wallets, FLOW **unifies and optimizes** how payments are made across all connected sources.

### Core Value Proposition

> "One tap. Best rail. Every time."

FLOW eliminates the cognitive load of choosing payment methods by intelligently routing transactions through the optimal rail based on:
- **Balance availability**
- **Merchant compatibility** 
- **User preferences & history**
- **Connector health**
- **Transaction context**

---

## Intelligence Modules

### 1. 📷 Scan Intelligence

**Purpose:** QR code scanning with automatic payment rail optimization

#### Current Capabilities ✅

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Multi-format QR Parsing** | Supports EMVCo (DuitNow), FLOW URLs, TouchNGo formats | `qr-to-intent.ts` |
| **5-Factor Rail Scoring** | Compatibility (35%), Balance (30%), Priority (15%), History (10%), Health (10%) | `smart-resolver.ts` |
| **Transaction History Analysis** | Queries last 30 days to favor frequently-used rails | `getPaymentHistory()` |
| **Merchant Compatibility Check** | Verifies if merchant accepts each rail | `scoreCompatibility()` |
| **Silent Top-Up Detection** | Identifies fallback source if primary rail has low balance | `findTopUpSource()` |
| **Connector Health Awareness** | Avoids degraded/unavailable connectors | `scoreHealth()` |
| **Explainability Engine** | Human-readable explanation for rail selection | `generateExplanation()` |
| **Real-time Recommendation UI** | Shows scored rails with breakdown | `SmartRailRecommendation.tsx` |

#### User Flow
```
Scan QR → Parse (EMVCo/FLOW/TNG) → Score Rails → Recommend Best
    ↓
Show Alternatives → User Confirms → Create Intent → Execute
```

#### Intelligence Output Example
```json
{
  "recommendedRail": "TouchNGo",
  "score": 87,
  "explanation": "TouchNGo has sufficient balance (RM 150) and you've used it 12 times at similar merchants",
  "alternatives": [
    { "rail": "GrabPay", "score": 72 },
    { "rail": "DuitNow", "score": 65 }
  ],
  "topUpNeeded": false
}
```

---

### 2. 💸 Send Intelligence

**Purpose:** P2P transfers with recipient wallet discovery and smart amount suggestions

#### Current Capabilities ✅

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Contact Sync** | Syncs phone contacts to database | `SendPage.tsx` |
| **Frequent Contact Scoring** | Ranks by recency (60%) + frequency (40%) | `FrequentContacts.tsx` |
| **Smart Amount Suggestions** | Calculates mode/average of past transfers to each contact | `suggestedAmount` field |
| **Wallet Detection per Contact** | Stores `supported_wallets` array per contact | `contacts` table |
| **Auto-select Default Wallet** | Uses contact's preferred wallet or first available | `defaultWallet` field |
| **DuitNow Universal Fallback** | Always available as backup rail | `railsAvailable` logic |
| **Contact Send History** | Shows total sent, average amount, recent transactions | `ContactSendHistory.tsx` |
| **Note/Memo Field** | Stored in intent metadata | `metadata.note` |

#### User Flow
```
Select Contact → Auto-suggest Amount → Pick Wallet
    ↓
Create SendMoney Intent → Smart Resolution → Execute
```

#### Intelligence Output Example
```json
{
  "frequentContacts": [
    {
      "name": "Sarah",
      "sendCount": 15,
      "lastSent": "2026-01-14",
      "suggestedAmount": 50,
      "defaultWallet": "TouchNGo"
    }
  ],
  "recommendation": "Send RM 50 to Sarah via TouchNGo (used 12 of 15 times)"
}
```

---

### 3. 🧾 Bills Intelligence

**Purpose:** Proactive bill management with urgency detection and auto-pay

#### Current Capabilities ✅

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Biller Linking** | Connect Maxis, Unifi, TNB accounts | `biller_accounts` table |
| **Urgency Detection** | Flags bills due ≤3 days as urgent | `isUrgent` calculation |
| **Bill Reminder Surface** | Proactive widget on HomePage | `BillReminderSurface.tsx` |
| **One-Tap PayBill Intent** | Create payment directly from reminder | `handlePayBill()` |
| **Payment History Analysis** | Tracks spending trends (up/down/stable) | `BillPaymentHistory.tsx` |
| **Trend Calculation** | Compares recent 3 vs previous 3 payments | `trendPercent` |
| **Auto-Pay Toggle UI** | Enable automatic payment 3 days before due | `AutoPayToggle.tsx` |
| **Smart Resolution for Bills** | Uses `can_pay` capability matching | `capabilityMap.PayBill` |

#### User Flow
```
Link Biller → System Detects Due Amount/Date → Surface on Home
    ↓
Urgency Badge → One-Tap Pay → Smart Resolution → Execute
```

#### Intelligence Output Example
```json
{
  "upcomingBills": [
    {
      "biller": "TNB",
      "amount": 127.50,
      "dueDate": "2026-01-19",
      "daysUntilDue": 3,
      "urgency": "urgent",
      "trend": "up",
      "trendPercent": 8.5
    }
  ],
  "autoPayEnabled": true,
  "preferredRail": "DuitNow"
}
```

---

### 4. 💳 FlowCard Intelligence

**Purpose:** Virtual card with intelligent routing for tap-to-pay transactions

#### Current Capabilities ✅

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Virtual Card Generation** | Luhn-valid Visa card numbers | `generateCardNumber()` |
| **Card Profile Management** | Status, mode, device binding | `flow_card_profiles` table |
| **Terminal Tap Simulation** | Creates `card_payment_events` | `simulateTerminalTap()` |
| **Smart Routing Integration** | Uses same resolution engine as Scan | `resolvePaymentRequest()` |
| **Explainability Summary** | "Paid with TouchNGo" explanation | `explainability_summary` |
| **Pending Event Queue** | User approves/declines transactions | `pendingEvents` |
| **Apple/Google Pay Stubs** | Provisioning status tracking | `card_provisioning` table |
| **Suspend/Reactivate** | Instant card control | `suspendCard()` |
| **Fallback Chain** | Multiple backup rails if primary fails | `fallback_chain` in decision |

#### User Flow
```
Tap at Terminal → FlowCard Receives Auth Request
    ↓
Resolution Engine Scores Rails → Select Best Source
    ↓
Show Pending Event → User Approves → Execute from Rail
```

#### Intelligence Output Example
```json
{
  "event": {
    "type": "terminal_tap",
    "amount": 45.00,
    "merchant": "Coffee Shop",
    "status": "evaluating"
  },
  "decision": {
    "selectedSource": "TouchNGo",
    "fallbackChain": ["GrabPay", "Maybank"],
    "requiresConfirmation": true,
    "explainability": "Paid with TouchNGo. Balance sufficient."
  }
}
```

---

## Smart Resolution Engine

### Core Algorithm

The resolution engine is shared across all intelligence modules:

```
┌─────────────────────────────────────────────────────────────┐
│                    SMART RESOLUTION                          │
├─────────────────────────────────────────────────────────────┤
│  INPUT: userId, amount, intentType, merchantRails           │
├─────────────────────────────────────────────────────────────┤
│  STEP 1: Fetch user's connected rails                       │
│  STEP 2: Fetch transaction history (30 days)                │
│  STEP 3: Score each rail:                                   │
│          • Compatibility: 35 points                         │
│          • Balance: 30 points                               │
│          • Priority: 15 points                              │
│          • History: 10 points                               │
│          • Health: 10 points                                │
│  STEP 4: Sort by total score                                │
│  STEP 5: Check if top-up needed                             │
│  STEP 6: Generate human explanation                         │
├─────────────────────────────────────────────────────────────┤
│  OUTPUT: recommendedRail, alternatives, topUpSource, reason │
└─────────────────────────────────────────────────────────────┘
```

### Scoring Breakdown

| Factor | Weight | What It Measures |
|--------|--------|------------------|
| **Compatibility** | 35% | Merchant accepts rail + rail has required capability |
| **Balance** | 30% | Sufficient funds (100 if full, 50 if needs top-up, 0 if impossible) |
| **Priority** | 15% | User's configured preference order |
| **History** | 10% | Frequency of past successful transactions |
| **Health** | 10% | Connector status (available/degraded/unavailable) |

---

## Database Architecture

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `intents` | Payment requests | type, amount, payee_name, metadata |
| `resolution_plans` | Execution strategies | chosen_rail, fallback_rail, steps |
| `transactions` | Completed payments | status, receipt |
| `funding_sources` | Connected rails | balance, priority, linked_status |
| `connectors` | App connections | status, capabilities |
| `transaction_logs` | History for ML | rail_used, merchant_name |
| `biller_accounts` | Linked bills | biller_name, status |
| `flow_card_profiles` | Virtual card | card_number, status |
| `card_payment_events` | Tap transactions | decision_json, explainability |

### Intent Types

```typescript
type IntentType = 
  | 'PayMerchant'  // QR scan payments
  | 'SendMoney'    // P2P transfers
  | 'RequestMoney' // Payment requests
  | 'PayBill';     // Utility payments
```

---

## Prototype vs Production

### What's Complete for Prototype ✅

| Module | Prototype Status |
|--------|------------------|
| **Scan** | Full UX flow, smart scoring, explainability |
| **Send** | Contact sync, frequency scoring, amount suggestions |
| **Bills** | Biller linking, urgency detection, history trends |
| **FlowCard** | Virtual card, tap simulation, routing integration |

### What Requires Bank Partnership 🏦

| Requirement | Needed For |
|-------------|------------|
| Real-time balance API | Live balance checks (currently uses DB cache) |
| DuitNow Proxy Lookup | Recipient wallet discovery |
| Card issuer license | Real FlowCard with Visa/Mastercard |
| Push Provisioning SDK | Apple Pay / Google Pay integration |
| Settlement webhooks | Transaction confirmation callbacks |
| PCI-DSS compliance | Card data handling |

---

## Competitive Differentiators

### vs. Single Wallet Apps (TouchNGo, GrabPay)

| Feature | Single Wallet | FLOW |
|---------|---------------|------|
| Payment methods | 1 | All connected |
| Rail selection | None | Intelligent |
| Balance optimization | Manual | Automatic |
| Merchant compatibility | Limited | Universal |

### vs. Banking Super Apps

| Feature | Bank App | FLOW |
|---------|----------|------|
| Wallet support | Own only | All wallets |
| Learning from history | Minimal | Deep analysis |
| Explainability | None | Full transparency |
| User control | Limited | Complete |

---

## Key Metrics (Prototype)

| Metric | Value |
|--------|-------|
| Supported payment rails | 6 (TNG, GrabPay, Boost, DuitNow, Bank, Card) |
| QR formats supported | 3 (EMVCo, FLOW, Provider-specific) |
| Intent types | 4 (PayMerchant, SendMoney, RequestMoney, PayBill) |
| Scoring factors | 5 (Compatibility, Balance, Priority, History, Health) |
| Resolution time | <100ms (simulated) |

---

## Appendix: Code Architecture

### Key Files

```
src/
├── lib/
│   ├── orchestration/
│   │   ├── smart-resolver.ts    # Core scoring engine
│   │   ├── resolver.ts          # Payment resolution
│   │   └── guardrails.ts        # Safety limits
│   ├── qr/
│   │   ├── qr-to-intent.ts      # QR parsing
│   │   └── emvco-parser.ts      # EMVCo format
│   └── core/
│       ├── resolve-engine.ts    # Intent resolution
│       └── execute-plan.ts      # Payment execution
├── hooks/
│   ├── useSmartResolution.ts    # React hook for scoring
│   ├── useFlowCard.ts           # Virtual card management
│   └── useFundingSources.ts     # Rail management
├── components/
│   ├── scanner/
│   │   ├── SmartRailRecommendation.tsx
│   │   └── FundingSourcePicker.tsx
│   ├── send/
│   │   ├── FrequentContacts.tsx
│   │   └── ContactSendHistory.tsx
│   └── bills/
│       ├── AutoPayToggle.tsx
│       └── BillPaymentHistory.tsx
└── pages/
    ├── ScanPage.tsx
    ├── SendPage.tsx
    ├── BillsPage.tsx
    └── FlowCardPage.tsx
```

---

## Contact

For technical questions about this prototype, refer to the codebase documentation or the Bank Partnership API Spec (`docs/FLOW_Bank_Partnership_API_Spec.md`).

---

*This document is generated for pitch deck preparation and investor presentations.*
