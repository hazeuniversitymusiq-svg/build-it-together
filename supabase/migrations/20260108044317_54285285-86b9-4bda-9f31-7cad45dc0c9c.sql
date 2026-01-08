
-- FLOW v1.0 Foundation - Step 2: Prototype Seed Action
-- =====================================================

CREATE OR REPLACE FUNCTION public.seed_prototype_data()
RETURNS TRIGGER AS $$
DECLARE
  v_connector_tng UUID;
  v_connector_grabpay UUID;
  v_connector_boost UUID;
  v_connector_duitnow UUID;
  v_connector_maybank UUID;
  v_connector_visa UUID;
  v_connector_maxis UUID;
  v_connector_unifi UUID;
  v_connector_tnb UUID;
  v_connector_contacts UUID;
BEGIN
  -- Only seed for Prototype mode
  IF NEW.app_mode != 'Prototype' THEN
    RETURN NEW;
  END IF;

  -- Update user identity status to active
  UPDATE public.users SET identity_status = 'active' WHERE id = NEW.id;

  -- Create TrustedDevice for current device
  INSERT INTO public.trusted_devices (user_id, device_id, trusted, last_seen_at)
  VALUES (NEW.id, COALESCE(NEW.device_id, 'prototype-device-001'), true, now());

  -- ========================================
  -- Seed FundingSources
  -- ========================================
  INSERT INTO public.funding_sources (user_id, type, name, priority, linked_status, available, balance, currency, max_auto_topup_amount, require_extra_confirm_amount)
  VALUES 
    (NEW.id, 'wallet', 'Touch n Go', 1, 'linked', true, 8, 'MYR', 200, 300),
    (NEW.id, 'bank', 'Maybank', 2, 'linked', true, 1200, 'MYR', 200, 300),
    (NEW.id, 'debit_card', 'Debit Card', 3, 'linked', true, 0, 'MYR', 200, 300),
    (NEW.id, 'credit_card', 'Credit Card', 4, 'linked', true, 0, 'MYR', 200, 300);

  -- ========================================
  -- Seed Connectors with capabilities
  -- ========================================
  
  -- Wallets (can_pay_qr, can_p2p, can_topup)
  INSERT INTO public.connectors (user_id, name, type, mode, status, capabilities)
  VALUES (NEW.id, 'TouchNGo', 'wallet', 'Prototype', 'available', '{"can_pay_qr": true, "can_p2p": true, "can_topup": true}')
  RETURNING id INTO v_connector_tng;

  INSERT INTO public.connectors (user_id, name, type, mode, status, capabilities)
  VALUES (NEW.id, 'GrabPay', 'wallet', 'Prototype', 'available', '{"can_pay_qr": true, "can_p2p": true, "can_topup": true}')
  RETURNING id INTO v_connector_grabpay;

  INSERT INTO public.connectors (user_id, name, type, mode, status, capabilities)
  VALUES (NEW.id, 'Boost', 'wallet', 'Prototype', 'available', '{"can_pay_qr": true, "can_p2p": true, "can_topup": true}')
  RETURNING id INTO v_connector_boost;

  INSERT INTO public.connectors (user_id, name, type, mode, status, capabilities)
  VALUES (NEW.id, 'DuitNow', 'wallet', 'Prototype', 'available', '{"can_pay_qr": true, "can_p2p": true, "can_topup": true}')
  RETURNING id INTO v_connector_duitnow;

  -- Banks (can_transfer, can_fund_topup)
  INSERT INTO public.connectors (user_id, name, type, mode, status, capabilities)
  VALUES (NEW.id, 'Maybank', 'bank', 'Prototype', 'available', '{"can_transfer": true, "can_fund_topup": true}')
  RETURNING id INTO v_connector_maybank;

  INSERT INTO public.connectors (user_id, name, type, mode, status, capabilities)
  VALUES (NEW.id, 'BankTransfer', 'bank', 'Prototype', 'available', '{"can_transfer": true, "can_fund_topup": true}');

  -- Cards (can_pay_qr, can_topup)
  INSERT INTO public.connectors (user_id, name, type, mode, status, capabilities)
  VALUES (NEW.id, 'VisaMastercard', 'card', 'Prototype', 'available', '{"can_pay_qr": true, "can_topup": true}')
  RETURNING id INTO v_connector_visa;

  -- Billers (can_fetch_due, can_pay)
  INSERT INTO public.connectors (user_id, name, type, mode, status, capabilities)
  VALUES (NEW.id, 'Maxis', 'biller', 'Prototype', 'available', '{"can_fetch_due": true, "can_pay": true}')
  RETURNING id INTO v_connector_maxis;

  INSERT INTO public.connectors (user_id, name, type, mode, status, capabilities)
  VALUES (NEW.id, 'Unifi', 'biller', 'Prototype', 'available', '{"can_fetch_due": true, "can_pay": true}')
  RETURNING id INTO v_connector_unifi;

  INSERT INTO public.connectors (user_id, name, type, mode, status, capabilities)
  VALUES (NEW.id, 'TNB', 'biller', 'Prototype', 'available', '{"can_fetch_due": true, "can_pay": true}')
  RETURNING id INTO v_connector_tnb;

  -- Contacts (can_read)
  INSERT INTO public.connectors (user_id, name, type, mode, status, capabilities)
  VALUES (NEW.id, 'Contacts', 'contacts', 'Prototype', 'available', '{"can_read": true}')
  RETURNING id INTO v_connector_contacts;

  -- ========================================
  -- Seed Contacts
  -- ========================================
  INSERT INTO public.contacts (user_id, name, phone, supported_wallets, default_wallet)
  VALUES 
    (NEW.id, 'Aina', '+60123456001', '["TouchNGo"]', 'TouchNGo'),
    (NEW.id, 'Jason', '+60123456002', '["GrabPay"]', 'GrabPay'),
    (NEW.id, 'Mei', '+60123456003', '["TouchNGo", "GrabPay"]', 'TouchNGo');

  -- ========================================
  -- Seed QR Payloads
  -- ========================================
  INSERT INTO public.qr_payloads (user_id, raw_payload, merchant_name, amount, reference_id, rails_available)
  VALUES 
    (NEW.id, 'flow://pay/ah-seng-mamak/12', 'Ah Seng Mamak', 12, 'ASM-001', '["TouchNGo", "DuitNow"]'),
    (NEW.id, 'flow://pay/kopi-corner/6.50', 'Kopi Corner', 6.50, 'KC-001', '["TouchNGo", "GrabPay"]'),
    (NEW.id, 'flow://pay/parking-mbpj/3', 'Parking MBPJ', 3, 'MBPJ-001', '["DuitNow"]'),
    (NEW.id, 'flow://pay/night-market/25', 'Night Market', 25, 'NM-001', '["TouchNGo"]'),
    (NEW.id, 'flow://pay/pharmacy/118', 'Pharmacy', 118, 'PH-001', '["TouchNGo", "DuitNow", "Card"]'),
    (NEW.id, 'flow://pay/restaurant/350', 'Restaurant', 350, 'RST-001', '["TouchNGo", "DuitNow", "Card"]');

  -- ========================================
  -- Seed BillerAccounts (unlinked)
  -- ========================================
  INSERT INTO public.biller_accounts (user_id, biller_name, account_reference, status)
  VALUES 
    (NEW.id, 'Maxis', '', 'unlinked'),
    (NEW.id, 'Unifi', '', 'unlinked'),
    (NEW.id, 'TNB', '', 'unlinked');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Create trigger to seed prototype data after user creation
CREATE TRIGGER trigger_seed_prototype_data
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_prototype_data();
