-- Create bkash_transactions table for automated payment tracking
CREATE TABLE IF NOT EXISTS public.bkash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trx_id TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  sender_number TEXT,
  reference TEXT,
  raw_sms TEXT,
  status TEXT NOT NULL DEFAULT 'unclaimed' CHECK (status IN ('unclaimed', 'matched', 'refunded', 'ignored')),
  matched_roll TEXT,
  matched_registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for speedy lookups
CREATE INDEX IF NOT EXISTS idx_bkash_transactions_trx_id ON public.bkash_transactions (upper(trx_id));
CREATE INDEX IF NOT EXISTS idx_bkash_transactions_status ON public.bkash_transactions (status);
CREATE INDEX IF NOT EXISTS idx_registrations_tx_id ON public.registrations (upper(tx_id));

-- Enable RLS
ALTER TABLE public.bkash_transactions ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage all transactions
CREATE POLICY "Admins full access on bkash_transactions"
ON public.bkash_transactions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow public / webhook to insert transactions
CREATE POLICY "Allow insert bkash_transactions"
ON public.bkash_transactions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow public read of bkash_transactions for registration verification
CREATE POLICY "Allow public read bkash_transactions"
ON public.bkash_transactions
FOR SELECT
TO anon, authenticated
USING (true);

-- 1. Trigger when a transaction is inserted:
-- Check if a registration with matching tx_id is already in 'pending' status
CREATE OR REPLACE FUNCTION public.match_bkash_transaction_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_reg_id UUID;
  v_reg_roll TEXT;
BEGIN
  NEW.trx_id := upper(trim(NEW.trx_id));

  -- Look for existing pending registration
  SELECT id, roll INTO v_reg_id, v_reg_roll
  FROM public.registrations
  WHERE upper(trim(tx_id)) = NEW.trx_id
    AND status = 'pending'
  LIMIT 1;

  IF v_reg_id IS NOT NULL THEN
    NEW.status := 'matched';
    NEW.matched_registration_id := v_reg_id;
    NEW.matched_roll := v_reg_roll;

    -- Update registration status to verified automatically!
    UPDATE public.registrations
    SET status = 'verified',
        updated_at = now()
    WHERE id = v_reg_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_match_bkash_transaction ON public.bkash_transactions;
CREATE TRIGGER trg_match_bkash_transaction
  BEFORE INSERT ON public.bkash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.match_bkash_transaction_on_insert();

-- 2. Trigger when a student registers:
-- Check if matching bkash_transaction already arrived
CREATE OR REPLACE FUNCTION public.match_registration_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_txn_id UUID;
  v_txn_status TEXT;
BEGIN
  IF NEW.tx_id IS NOT NULL AND NEW.tx_id <> '' THEN
    NEW.tx_id := upper(trim(NEW.tx_id));

    SELECT id, status INTO v_txn_id, v_txn_status
    FROM public.bkash_transactions
    WHERE upper(trim(trx_id)) = NEW.tx_id
    LIMIT 1;

    IF v_txn_id IS NOT NULL AND v_txn_status = 'unclaimed' THEN
      -- Instant verification!
      NEW.status := 'verified';

      UPDATE public.bkash_transactions
      SET status = 'matched',
          matched_roll = NEW.roll,
          matched_registration_id = NEW.id,
          updated_at = now()
      WHERE id = v_txn_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_match_registration ON public.registrations;
CREATE TRIGGER trg_match_registration
  BEFORE INSERT ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.match_registration_on_insert();

-- 3. Robust RPC Function to parse raw SMS and insert transaction
CREATE OR REPLACE FUNCTION public.parse_and_insert_bkash_sms(p_raw_sms text, p_sender text DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
  v_trx_id text;
  v_amount numeric;
  v_sender text;
  v_ref text;
  v_clean_amt text;
  v_new_id uuid;
  v_status text;
  v_matched_roll text;
BEGIN
  -- 1. Extract TrxID / TxnID
  v_trx_id := (regexp_match(p_raw_sms, '(?:TrxID|TxnID|trxid|txnid|TXNID|TRXID)[:\s]+([A-Za-z0-9]+)', 'i'))[1];

  -- 2. Extract Amount
  v_clean_amt := (regexp_match(p_raw_sms, '(?:Tk|TK|tk|৳|Amount)[:\s]*([0-9,]+(?:\.[0-9]{1,2})?)', 'i'))[1];
  IF v_clean_amt IS NOT NULL THEN
    v_clean_amt := replace(v_clean_amt, ',', '');
    v_amount := v_clean_amt::numeric;
  END IF;

  -- 3. Extract Sender phone number
  v_sender := (regexp_match(p_raw_sms, '(?:from|From|sender|Sender)[:\s]+(?:\+88)?(01[3-9][0-9]{8})', 'i'))[1];
  IF v_sender IS NULL AND p_sender IS NOT NULL THEN
    v_sender := p_sender;
  END IF;

  -- 4. Extract Reference
  v_ref := (regexp_match(p_raw_sms, '(?:Ref|ref|Reference|রেফারেন্স)[:\s]+([A-Za-z0-9_-]+)', 'i'))[1];

  IF v_trx_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Could not parse TrxID from SMS');
  END IF;

  v_trx_id := upper(trim(v_trx_id));

  -- Insert into bkash_transactions (on conflict, update raw_sms)
  INSERT INTO public.bkash_transactions (trx_id, amount, sender_number, reference, raw_sms)
  VALUES (v_trx_id, COALESCE(v_amount, 0), v_sender, v_ref, p_raw_sms)
  ON CONFLICT (trx_id) DO UPDATE
  SET raw_sms = EXCLUDED.raw_sms, updated_at = now()
  RETURNING id, status, matched_roll INTO v_new_id, v_status, v_matched_roll;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_new_id,
    'trx_id', v_trx_id,
    'amount', v_amount,
    'sender', v_sender,
    'reference', v_ref,
    'status', v_status,
    'matched_roll', v_matched_roll
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.parse_and_insert_bkash_sms(text, text) TO anon, authenticated;
