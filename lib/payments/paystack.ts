// Thin wrapper around the Paystack REST API.
// Sign up at https://paystack.com and set PAYSTACK_SECRET_KEY /
// NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY in your environment. Use TEST mode keys
// during development — Paystack's test mode supports simulated Mobile
// Money and card payments without moving real money.

import { createHmac } from "crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function requireSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not set. Add your Paystack secret key to .env.local " +
        "(sign up at https://paystack.com, use a TEST key while developing)."
    );
  }
  return key;
}

export async function initializeTransaction(params: {
  email: string;
  amountGhs: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      // Paystack expects the amount in the smallest currency unit
      // (pesewas for GHS), hence the *100.
      amount: Math.round(params.amountGhs * 100),
      reference: params.reference,
      callback_url: params.callbackUrl,
      currency: "GHS",
      metadata: params.metadata,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Paystack initialize failed: ${errorBody}`);
  }

  return res.json() as Promise<{
    status: boolean;
    data: { authorization_url: string; access_code: string; reference: string };
  }>;
}

export async function verifyTransaction(reference: string) {
  const res = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${requireSecretKey()}` },
    }
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Paystack verify failed: ${errorBody}`);
  }

  return res.json() as Promise<{
    status: boolean;
    data: { status: string; reference: string; amount: number };
  }>;
}

// Validates the X-Paystack-Signature header on incoming webhooks using
// HMAC SHA512 of the raw request body, as required by Paystack.
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) return false;
  const hash = createHmac("sha512", requireSecretKey())
    .update(rawBody)
    .digest("hex");
  return hash === signatureHeader;
}
