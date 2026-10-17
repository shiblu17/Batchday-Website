/**
 * bKash & Nagad SMS Parser Utility
 * Extracts TrxID, Amount, Sender Number, and Reference from raw mobile banking SMS
 */

export interface ParsedPaymentSMS {
  trxId: string | null;
  amount: number | null;
  senderNumber: string | null;
  reference: string | null;
  provider: "bkash" | "nagad" | "unknown";
  raw: string;
}

export function parsePaymentSMS(rawSms: string): ParsedPaymentSMS {
  const text = rawSms.trim();
  let provider: "bkash" | "nagad" | "unknown" = "unknown";

  if (/bkash|বিকাশ/i.test(text)) {
    provider = "bkash";
  } else if (/nagad|নগদ/i.test(text)) {
    provider = "nagad";
  }

  // 1. TrxID / TxnID extraction
  // Matches: "TrxID 9B7DXXXXXX", "TxnID: 71XXXXXX", "TrxID: ...", "Transaction ID: ..."
  let trxId: string | null = null;
  const trxMatch = text.match(/(?:TrxID|TxnID|trxid|txnid|TXNID|TRXID)[:\s]+([A-Za-z0-9]+)/i);
  if (trxMatch && trxMatch[1]) {
    trxId = trxMatch[1].trim().toUpperCase();
  }

  // 2. Amount extraction
  // Matches: "Tk 500.00", "Tk500", "Amount: Tk 1,000.00", "৳500"
  let amount: number | null = null;
  const amountMatch = text.match(/(?:Tk|TK|tk|৳|Amount)[:\s]*([0-9,]+(?:\.[0-9]{1,2})?)/i);
  if (amountMatch && amountMatch[1]) {
    const cleanNum = amountMatch[1].replace(/,/g, "");
    const parsed = parseFloat(cleanNum);
    if (!isNaN(parsed)) {
      amount = parsed;
    }
  }

  // 3. Sender number extraction
  // Matches: "from 017XXXXXXXX", "Sender: 017XXXXXXXX", "+88017..."
  let senderNumber: string | null = null;
  const senderMatch = text.match(/(?:from|From|sender|Sender)[:\s]+(?:\+88)?(01[3-9][0-9]{8})/i);
  if (senderMatch && senderMatch[1]) {
    senderNumber = senderMatch[1].trim();
  }

  // 4. Reference extraction
  let reference: string | null = null;
  const refMatch = text.match(/(?:Ref|ref|Reference|রেফারেন্স)[:\s]+([A-Za-z0-9_-]+)/i);
  if (refMatch && refMatch[1]) {
    reference = refMatch[1].trim();
  }

  return {
    trxId,
    amount,
    senderNumber,
    reference,
    provider,
    raw: text,
  };
}
