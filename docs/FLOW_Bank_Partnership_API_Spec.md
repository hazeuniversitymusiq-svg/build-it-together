# FLOW × Bank Partnership
## Technical API Specification v1.0

---

## Executive Summary

FLOW is a unified payment orchestration layer that enables seamless "Scan → Authorize → Pay" experiences across Malaysia's fragmented payment ecosystem. We're seeking a banking partner to provide the API infrastructure that powers instant, secure payments without app-switching.

**What FLOW Delivers:**
- Unified payment UX across all touchpoints
- Smart routing and spending intelligence
- New customer acquisition channel
- Reduced friction = higher transaction volume

**What We Need:**
- 4 Core API Endpoints
- OAuth 2.0 / Open Banking authentication
- Real-time webhook notifications

---

## 1. Authentication & Security

### 1.1 OAuth 2.0 Flow

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│  FLOW   │      │  Bank   │      │  User   │
│   App   │      │  Auth   │      │ Browser │
└────┬────┘      └────┬────┘      └────┬────┘
     │                │                │
     │ 1. Redirect to Bank Auth        │
     │────────────────────────────────>│
     │                │                │
     │                │ 2. User Login  │
     │                │<───────────────│
     │                │                │
     │                │ 3. Consent     │
     │                │<───────────────│
     │                │                │
     │ 4. Auth Code   │                │
     │<───────────────────────────────│
     │                │                │
     │ 5. Exchange    │                │
     │    for Token   │                │
     │───────────────>│                │
     │                │                │
     │ 6. Access +    │                │
     │    Refresh     │                │
     │<───────────────│                │
```

### 1.2 Token Requirements

| Token Type | Expiry | Usage |
|------------|--------|-------|
| Access Token | 15 minutes | API calls |
| Refresh Token | 90 days | Token renewal |
| Consent Token | User-controlled | Scope management |

### 1.3 Security Standards

- **Transport**: TLS 1.3 minimum
- **Signing**: RS256 JWT for all requests
- **Encryption**: AES-256 for sensitive payload data
- **Rate Limiting**: 100 requests/minute per user
- **IP Whitelisting**: FLOW production IPs registered

---

## 2. Required API Endpoints

### 2.1 Account Balance API

**Purpose:** Display real-time balance in FLOW without opening bank app

```http
GET /v1/accounts/{account_id}/balance
Authorization: Bearer {access_token}
X-Request-ID: {uuid}
X-Timestamp: {iso8601}
```

**Response:**
```json
{
  "account_id": "acc_abc123",
  "account_type": "savings",
  "currency": "MYR",
  "available_balance": 1247.50,
  "current_balance": 1297.50,
  "pending_transactions": 50.00,
  "as_of": "2024-01-15T10:30:00+08:00",
  "daily_limit": {
    "total": 5000.00,
    "used": 350.00,
    "remaining": 4650.00
  }
}
```

**Error Codes:**
| Code | Meaning |
|------|---------|
| 401 | Token expired/invalid |
| 403 | Consent revoked |
| 404 | Account not found |
| 429 | Rate limit exceeded |

---

### 2.2 Payment Initiation API

**Purpose:** Execute payments directly from FLOW without app handoff

```http
POST /v1/payments/initiate
Authorization: Bearer {access_token}
X-Request-ID: {uuid}
X-Idempotency-Key: {uuid}
Content-Type: application/json
```

**Request Body:**
```json
{
  "source_account": "acc_abc123",
  "payment_type": "duitnow_qr",
  "amount": {
    "value": 12.50,
    "currency": "MYR"
  },
  "recipient": {
    "type": "merchant",
    "name": "Ah Seng Mamak",
    "duitnow_id": "DQR001234567890",
    "merchant_category": "5812"
  },
  "reference": "FLOW-TXN-20240115-001",
  "metadata": {
    "flow_intent_id": "intent_xyz789",
    "source_surface": "qr_scan",
    "device_id": "device_abc"
  }
}
```

**Response (Success):**
```json
{
  "payment_id": "pay_def456",
  "status": "completed",
  "amount": {
    "value": 12.50,
    "currency": "MYR"
  },
  "recipient": {
    "name": "Ah Seng Mamak",
    "masked_account": "****7890"
  },
  "completed_at": "2024-01-15T10:30:05+08:00",
  "reference": "FLOW-TXN-20240115-001",
  "bank_reference": "BNK240115103005DEF",
  "receipt_url": "https://bank.com/receipts/pay_def456"
}
```

**Response (Requires 2FA):**
```json
{
  "payment_id": "pay_def456",
  "status": "pending_authorization",
  "authorization": {
    "type": "biometric",
    "challenge_id": "chal_xyz",
    "expires_at": "2024-01-15T10:32:00+08:00",
    "methods_available": ["biometric", "pin", "otp"]
  }
}
```

**Payment Types Supported:**
| Type | Description |
|------|-------------|
| `duitnow_qr` | DuitNow QR merchant payments |
| `duitnow_transfer` | P2P via DuitNow proxy |
| `instant_transfer` | IBG/IBFT transfers |
| `bill_payment` | JomPAY / Direct Debit |

---

### 2.3 Payment Authorization API

**Purpose:** Complete 2FA for payments above threshold

```http
POST /v1/payments/{payment_id}/authorize
Authorization: Bearer {access_token}
X-Request-ID: {uuid}
Content-Type: application/json
```

**Request (Biometric):**
```json
{
  "challenge_id": "chal_xyz",
  "authorization_type": "biometric",
  "biometric_signature": {
    "type": "fido2",
    "assertion": "base64_encoded_assertion",
    "client_data": "base64_encoded_client_data"
  },
  "device_attestation": {
    "device_id": "device_abc",
    "platform": "ios",
    "is_trusted": true
  }
}
```

**Request (PIN/OTP):**
```json
{
  "challenge_id": "chal_xyz",
  "authorization_type": "pin",
  "encrypted_credential": "encrypted_pin_value",
  "device_attestation": {
    "device_id": "device_abc",
    "platform": "android",
    "is_trusted": true
  }
}
```

**Response:**
```json
{
  "payment_id": "pay_def456",
  "status": "completed",
  "authorized_at": "2024-01-15T10:30:45+08:00",
  "authorization_method": "biometric",
  "bank_reference": "BNK240115103045DEF"
}
```

---

### 2.4 Transaction History API

**Purpose:** Sync transaction history for spending insights

```http
GET /v1/accounts/{account_id}/transactions
Authorization: Bearer {access_token}
X-Request-ID: {uuid}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `from_date` | ISO8601 | Start date (default: 30 days ago) |
| `to_date` | ISO8601 | End date (default: now) |
| `limit` | integer | Max results (default: 50, max: 200) |
| `cursor` | string | Pagination cursor |
| `type` | string | Filter: credit, debit, all |

**Response:**
```json
{
  "account_id": "acc_abc123",
  "transactions": [
    {
      "transaction_id": "txn_001",
      "type": "debit",
      "amount": {
        "value": 12.50,
        "currency": "MYR"
      },
      "description": "Ah Seng Mamak",
      "category": "food_dining",
      "merchant": {
        "name": "Ah Seng Mamak",
        "category_code": "5812",
        "location": "Petaling Jaya"
      },
      "channel": "duitnow_qr",
      "status": "completed",
      "posted_at": "2024-01-15T10:30:05+08:00",
      "reference": "FLOW-TXN-20240115-001"
    }
  ],
  "pagination": {
    "has_more": true,
    "next_cursor": "cursor_abc123"
  },
  "summary": {
    "total_debit": 1250.00,
    "total_credit": 3000.00,
    "transaction_count": 47
  }
}
```

---

## 3. Webhook Notifications

### 3.1 Webhook Registration

```http
POST /v1/webhooks
Authorization: Bearer {client_credentials_token}
Content-Type: application/json
```

```json
{
  "url": "https://api.flow.my/webhooks/bank",
  "events": [
    "payment.completed",
    "payment.failed",
    "balance.updated",
    "consent.revoked"
  ],
  "secret": "whsec_..."
}
```

### 3.2 Webhook Payload

```json
{
  "event_id": "evt_abc123",
  "event_type": "payment.completed",
  "created_at": "2024-01-15T10:30:05+08:00",
  "data": {
    "payment_id": "pay_def456",
    "account_id": "acc_abc123",
    "amount": 12.50,
    "currency": "MYR",
    "status": "completed"
  },
  "signature": "sha256=..."
}
```

### 3.3 Event Types

| Event | Trigger |
|-------|---------|
| `payment.completed` | Payment successful |
| `payment.failed` | Payment failed |
| `payment.pending` | Awaiting authorization |
| `balance.updated` | Balance changed |
| `consent.revoked` | User revoked access |
| `account.suspended` | Account frozen |

---

## 4. Consent Management

### 4.1 Consent Scopes

| Scope | Access Granted |
|-------|---------------|
| `balance:read` | View account balance |
| `transactions:read` | View transaction history |
| `payments:write` | Initiate payments |
| `payments:authorize` | Authorize high-value payments |

### 4.2 Consent Duration

- **Default**: 12 months
- **Renewal**: Automatic with user prompt at 11 months
- **Revocation**: Instant via bank app or FLOW settings

### 4.3 Consent Verification Endpoint

```http
GET /v1/consents/{consent_id}
Authorization: Bearer {access_token}
```

```json
{
  "consent_id": "con_abc123",
  "status": "active",
  "scopes": ["balance:read", "payments:write"],
  "granted_at": "2024-01-01T00:00:00+08:00",
  "expires_at": "2025-01-01T00:00:00+08:00",
  "account_ids": ["acc_abc123"]
}
```

---

## 5. Error Handling

### 5.1 Standard Error Response

```json
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Account has insufficient balance for this transaction",
    "details": {
      "available_balance": 10.00,
      "requested_amount": 12.50
    },
    "request_id": "req_abc123",
    "documentation_url": "https://docs.bank.com/errors/INSUFFICIENT_FUNDS"
  }
}
```

### 5.2 Error Code Reference

| Code | HTTP Status | Description | FLOW Handling |
|------|-------------|-------------|---------------|
| `INSUFFICIENT_FUNDS` | 400 | Balance too low | Show balance, suggest top-up |
| `DAILY_LIMIT_EXCEEDED` | 400 | Daily limit hit | Show limit status |
| `INVALID_RECIPIENT` | 400 | DuitNow ID invalid | Prompt re-scan |
| `AUTHORIZATION_FAILED` | 401 | Biometric/PIN failed | Retry prompt |
| `CONSENT_EXPIRED` | 403 | Re-auth needed | Trigger OAuth flow |
| `ACCOUNT_SUSPENDED` | 403 | Account frozen | Show support contact |
| `DUPLICATE_PAYMENT` | 409 | Idempotency conflict | Show existing receipt |
| `SERVICE_UNAVAILABLE` | 503 | Bank system down | Queue for retry |

---

## 6. Rate Limits & SLAs

### 6.1 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Balance | 60 requests | per minute |
| Payments | 30 requests | per minute |
| Transactions | 20 requests | per minute |

### 6.2 Expected SLAs

| Metric | Target |
|--------|--------|
| API Availability | 99.95% |
| Balance Response | < 200ms |
| Payment Initiation | < 500ms |
| Payment Completion | < 3 seconds |
| Webhook Delivery | < 5 seconds |

---

## 7. Testing & Sandbox

### 7.1 Sandbox Environment

```
Base URL: https://sandbox.api.bank.com/v1
```

### 7.2 Test Accounts

| Account ID | Balance | Scenario |
|------------|---------|----------|
| `test_sufficient` | RM 10,000 | Normal payments |
| `test_low` | RM 5.00 | Insufficient funds |
| `test_limited` | RM 500 | Daily limit exceeded |
| `test_suspended` | RM 1,000 | Account frozen |

### 7.3 Test Card Numbers (if applicable)

| Number | Scenario |
|--------|----------|
| 4111 1111 1111 1111 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0000 0000 0069 | 3DS Required |

---

## 8. Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1** | 2 weeks | Sandbox access, OAuth integration |
| **Phase 2** | 4 weeks | Balance API, basic payments |
| **Phase 3** | 4 weeks | Full payment flow, 2FA integration |
| **Phase 4** | 2 weeks | Webhooks, transaction sync |
| **Phase 5** | 2 weeks | UAT, security audit |
| **Launch** | - | Production go-live |

---

## 9. Contact & Support

**FLOW Technical Team**
- API Integration: api@flow.my
- Security: security@flow.my

**Documentation**
- Developer Portal: https://developers.flow.my
- API Reference: https://api.flow.my/docs

---

## Appendix A: Sample Integration Code

### A.1 Payment Flow (TypeScript)

```typescript
// FLOW backend integration example
async function executePayment(intent: PaymentIntent): Promise<PaymentResult> {
  // 1. Get user's access token (stored from OAuth)
  const accessToken = await getStoredAccessToken(intent.userId);
  
  // 2. Check balance first
  const balance = await bankApi.getBalance(accessToken, intent.accountId);
  
  if (balance.available < intent.amount) {
    return { success: false, error: 'INSUFFICIENT_FUNDS' };
  }
  
  // 3. Initiate payment
  const payment = await bankApi.initiatePayment(accessToken, {
    source_account: intent.accountId,
    payment_type: 'duitnow_qr',
    amount: { value: intent.amount, currency: 'MYR' },
    recipient: intent.merchant,
    reference: `FLOW-${intent.id}`
  });
  
  // 4. Handle authorization if required
  if (payment.status === 'pending_authorization') {
    // Trigger biometric prompt in FLOW app
    const authResult = await requestBiometricAuth(payment.authorization);
    
    await bankApi.authorizePayment(accessToken, payment.payment_id, {
      challenge_id: payment.authorization.challenge_id,
      authorization_type: 'biometric',
      biometric_signature: authResult.signature
    });
  }
  
  // 5. Return success
  return {
    success: true,
    transactionId: payment.payment_id,
    receipt: payment.receipt_url
  };
}
```

---

## Appendix B: DuitNow QR Parsing

FLOW parses EMVCo-compliant DuitNow QR codes:

```typescript
interface DuitNowQRData {
  merchantName: string;        // Tag 59
  merchantCity: string;        // Tag 60
  amount?: number;             // Tag 54 (optional)
  transactionCurrency: string; // Tag 53
  merchantAccountInfo: {
    duitnowId: string;         // Tag 26 sub-field
    acquirerCode: string;
  };
  additionalData?: {
    referenceLabel?: string;   // Tag 62 sub-field 05
    terminalLabel?: string;    // Tag 62 sub-field 07
  };
}
```

---

*Document Version: 1.0*  
*Last Updated: January 2024*  
*Classification: Confidential - Partner Use Only*
