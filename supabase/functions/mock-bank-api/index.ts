/**
 * Mock Bank API - Simulates Bank Partner Responses
 * 
 * Endpoints:
 * - GET /balance - Get account balance
 * - POST /payments/initiate - Start a payment
 * - POST /payments/authorize - Complete 2FA
 * - GET /transactions - Get transaction history
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id, x-idempotency-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Simulated processing delays (ms)
const DELAYS = {
  balance: 150,
  payment: 800,
  authorize: 400,
  transactions: 200,
};

// Simulated bank accounts
const MOCK_ACCOUNTS: Record<string, {
  balance: number;
  dailyLimit: number;
  dailyUsed: number;
  name: string;
  accountType: string;
}> = {};

// Simulated pending payments awaiting authorization
const PENDING_PAYMENTS: Map<string, {
  amount: number;
  recipient: string;
  challengeId: string;
  expiresAt: Date;
  userId: string;
}> = new Map();

// Simulated completed transactions
const TRANSACTION_HISTORY: Map<string, Array<{
  id: string;
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  category: string;
  status: string;
  postedAt: string;
  reference: string;
}>> = new Map();

function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getOrCreateAccount(userId: string): typeof MOCK_ACCOUNTS[string] {
  if (!MOCK_ACCOUNTS[userId]) {
    MOCK_ACCOUNTS[userId] = {
      balance: 1247.50,
      dailyLimit: 5000,
      dailyUsed: 350,
      name: 'RYT Bank Savings',
      accountType: 'savings',
    };
  }
  return MOCK_ACCOUNTS[userId];
}

function getTransactionHistory(userId: string) {
  if (!TRANSACTION_HISTORY.has(userId)) {
    // Seed with some mock transactions
    TRANSACTION_HISTORY.set(userId, [
      {
        id: generateId('txn'),
        type: 'debit',
        amount: 45.00,
        description: 'Village Park Restaurant',
        category: 'food_dining',
        status: 'completed',
        postedAt: new Date(Date.now() - 86400000).toISOString(),
        reference: 'FLOW-DEMO-001',
      },
      {
        id: generateId('txn'),
        type: 'debit',
        amount: 12.50,
        description: 'Starbucks KLCC',
        category: 'food_dining',
        status: 'completed',
        postedAt: new Date(Date.now() - 172800000).toISOString(),
        reference: 'FLOW-DEMO-002',
      },
      {
        id: generateId('txn'),
        type: 'credit',
        amount: 3000.00,
        description: 'Salary Credit',
        category: 'income',
        status: 'completed',
        postedAt: new Date(Date.now() - 259200000).toISOString(),
        reference: 'SAL-JAN-2024',
      },
      {
        id: generateId('txn'),
        type: 'debit',
        amount: 89.90,
        description: 'Grab Transport',
        category: 'transport',
        status: 'completed',
        postedAt: new Date(Date.now() - 345600000).toISOString(),
        reference: 'GRAB-001',
      },
    ]);
  }
  return TRANSACTION_HISTORY.get(userId)!;
}

// Handler: GET /balance
async function handleGetBalance(userId: string): Promise<Response> {
  await delay(DELAYS.balance);
  
  const account = getOrCreateAccount(userId);
  
  return new Response(JSON.stringify({
    account_id: `acc_${userId.slice(0, 8)}`,
    account_type: account.accountType,
    account_name: account.name,
    currency: 'MYR',
    available_balance: account.balance,
    current_balance: account.balance + 50, // Simulated pending
    pending_transactions: 50.00,
    as_of: new Date().toISOString(),
    daily_limit: {
      total: account.dailyLimit,
      used: account.dailyUsed,
      remaining: account.dailyLimit - account.dailyUsed,
    },
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handler: POST /payments/initiate
async function handlePaymentInitiate(userId: string, body: {
  amount: { value: number; currency: string };
  recipient: { name: string; duitnow_id?: string };
  reference: string;
}): Promise<Response> {
  await delay(DELAYS.payment);
  
  const account = getOrCreateAccount(userId);
  const amount = body.amount.value;
  
  // Check insufficient funds
  if (amount > account.balance) {
    return new Response(JSON.stringify({
      error: {
        code: 'INSUFFICIENT_FUNDS',
        message: 'Account has insufficient balance for this transaction',
        details: {
          available_balance: account.balance,
          requested_amount: amount,
        },
        request_id: generateId('req'),
      },
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Check daily limit
  if (account.dailyUsed + amount > account.dailyLimit) {
    return new Response(JSON.stringify({
      error: {
        code: 'DAILY_LIMIT_EXCEEDED',
        message: 'Transaction would exceed daily limit',
        details: {
          daily_limit: account.dailyLimit,
          daily_used: account.dailyUsed,
          remaining: account.dailyLimit - account.dailyUsed,
          requested_amount: amount,
        },
        request_id: generateId('req'),
      },
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  const paymentId = generateId('pay');
  
  // Payments over RM50 require 2FA
  if (amount > 50) {
    const challengeId = generateId('chal');
    const expiresAt = new Date(Date.now() + 120000); // 2 minutes
    
    PENDING_PAYMENTS.set(paymentId, {
      amount,
      recipient: body.recipient.name,
      challengeId,
      expiresAt,
      userId,
    });
    
    return new Response(JSON.stringify({
      payment_id: paymentId,
      status: 'pending_authorization',
      amount: body.amount,
      recipient: {
        name: body.recipient.name,
        masked_account: '****' + (body.recipient.duitnow_id?.slice(-4) || '7890'),
      },
      authorization: {
        type: 'biometric',
        challenge_id: challengeId,
        expires_at: expiresAt.toISOString(),
        methods_available: ['biometric', 'pin'],
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Small payments complete instantly
  account.balance -= amount;
  account.dailyUsed += amount;
  
  // Add to transaction history
  const transactions = getTransactionHistory(userId);
  transactions.unshift({
    id: generateId('txn'),
    type: 'debit',
    amount,
    description: body.recipient.name,
    category: 'payment',
    status: 'completed',
    postedAt: new Date().toISOString(),
    reference: body.reference,
  });
  
  const bankReference = `BNK${Date.now().toString(36).toUpperCase()}`;
  
  return new Response(JSON.stringify({
    payment_id: paymentId,
    status: 'completed',
    amount: body.amount,
    recipient: {
      name: body.recipient.name,
      masked_account: '****' + (body.recipient.duitnow_id?.slice(-4) || '7890'),
    },
    completed_at: new Date().toISOString(),
    reference: body.reference,
    bank_reference: bankReference,
    new_balance: account.balance,
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handler: POST /payments/authorize
async function handlePaymentAuthorize(paymentId: string, body: {
  challenge_id: string;
  authorization_type: 'biometric' | 'pin';
}): Promise<Response> {
  await delay(DELAYS.authorize);
  
  const pending = PENDING_PAYMENTS.get(paymentId);
  
  if (!pending) {
    return new Response(JSON.stringify({
      error: {
        code: 'PAYMENT_NOT_FOUND',
        message: 'Payment not found or already processed',
        request_id: generateId('req'),
      },
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  if (body.challenge_id !== pending.challengeId) {
    return new Response(JSON.stringify({
      error: {
        code: 'INVALID_CHALLENGE',
        message: 'Challenge ID does not match',
        request_id: generateId('req'),
      },
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  if (new Date() > pending.expiresAt) {
    PENDING_PAYMENTS.delete(paymentId);
    return new Response(JSON.stringify({
      error: {
        code: 'AUTHORIZATION_EXPIRED',
        message: 'Authorization window has expired',
        request_id: generateId('req'),
      },
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Complete the payment
  const account = getOrCreateAccount(pending.userId);
  account.balance -= pending.amount;
  account.dailyUsed += pending.amount;
  
  // Add to transaction history
  const transactions = getTransactionHistory(pending.userId);
  transactions.unshift({
    id: generateId('txn'),
    type: 'debit',
    amount: pending.amount,
    description: pending.recipient,
    category: 'payment',
    status: 'completed',
    postedAt: new Date().toISOString(),
    reference: `FLOW-${paymentId}`,
  });
  
  PENDING_PAYMENTS.delete(paymentId);
  
  const bankReference = `BNK${Date.now().toString(36).toUpperCase()}`;
  
  return new Response(JSON.stringify({
    payment_id: paymentId,
    status: 'completed',
    authorized_at: new Date().toISOString(),
    authorization_method: body.authorization_type,
    bank_reference: bankReference,
    new_balance: account.balance,
    recipient: pending.recipient,
    amount: pending.amount,
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handler: GET /transactions
async function handleGetTransactions(userId: string, params: URLSearchParams): Promise<Response> {
  await delay(DELAYS.transactions);
  
  const transactions = getTransactionHistory(userId);
  const limit = Math.min(parseInt(params.get('limit') || '50'), 200);
  const typeFilter = params.get('type');
  
  let filtered = transactions;
  if (typeFilter && typeFilter !== 'all') {
    filtered = transactions.filter(t => t.type === typeFilter);
  }
  
  const result = filtered.slice(0, limit);
  
  const totalDebit = result.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
  const totalCredit = result.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  
  return new Response(JSON.stringify({
    account_id: `acc_${userId.slice(0, 8)}`,
    transactions: result.map(t => ({
      transaction_id: t.id,
      type: t.type,
      amount: { value: t.amount, currency: 'MYR' },
      description: t.description,
      category: t.category,
      status: t.status,
      posted_at: t.postedAt,
      reference: t.reference,
    })),
    pagination: {
      has_more: filtered.length > limit,
      next_cursor: filtered.length > limit ? 'cursor_next' : null,
    },
    summary: {
      total_debit: totalDebit,
      total_credit: totalCredit,
      transaction_count: result.length,
    },
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handler: POST /balance/sync - Sync balance from FLOW (for demo)
async function handleBalanceSync(userId: string, body: { balance: number }): Promise<Response> {
  const account = getOrCreateAccount(userId);
  account.balance = body.balance;
  
  return new Response(JSON.stringify({
    success: true,
    new_balance: account.balance,
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Remove 'mock-bank-api' from path if present
    const apiPath = pathParts[0] === 'mock-bank-api' ? pathParts.slice(1) : pathParts;
    
    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    let userId = 'demo-user';
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      // Try to extract user from JWT
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (user) userId = user.id;
      } catch {
        // Use demo user if auth fails
      }
    }

    // Route requests
    const endpoint = apiPath.join('/');
    
    // GET /balance
    if (req.method === 'GET' && endpoint === 'balance') {
      return handleGetBalance(userId);
    }
    
    // POST /balance/sync
    if (req.method === 'POST' && endpoint === 'balance/sync') {
      const body = await req.json();
      return handleBalanceSync(userId, body);
    }
    
    // POST /payments/initiate
    if (req.method === 'POST' && endpoint === 'payments/initiate') {
      const body = await req.json();
      return handlePaymentInitiate(userId, body);
    }
    
    // POST /payments/:id/authorize
    if (req.method === 'POST' && apiPath[0] === 'payments' && apiPath[2] === 'authorize') {
      const paymentId = apiPath[1];
      const body = await req.json();
      return handlePaymentAuthorize(paymentId, body);
    }
    
    // GET /transactions
    if (req.method === 'GET' && endpoint === 'transactions') {
      return handleGetTransactions(userId, url.searchParams);
    }
    
    // 404 for unknown endpoints
    return new Response(JSON.stringify({
      error: {
        code: 'NOT_FOUND',
        message: `Unknown endpoint: ${endpoint}`,
        available_endpoints: [
          'GET /balance',
          'POST /balance/sync',
          'POST /payments/initiate',
          'POST /payments/:id/authorize',
          'GET /transactions',
        ],
      },
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Mock Bank API Error:', error);
    return new Response(JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
