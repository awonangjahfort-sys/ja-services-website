import "server-only";
import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentProvider,
  VerifyWebhookResult,
} from "./types";

// Campay REST API. Base URL differs for sandbox vs live -- set
// CAMPAY_BASE_URL accordingly (see .env.example).
// Docs referenced: https://documenter.getpostman.com/view/2391374/T1LV8PVA
//
// IMPORTANT: verify the exact field names against your Campay dashboard once
// you have an account -- aggregator APIs occasionally rename fields between
// docs and what's actually live. The shapes below match Campay's published
// /token/, /collect/, and /transaction/ endpoints as of writing.

const BASE_URL = process.env.CAMPAY_BASE_URL || "https://www.campay.net/api";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const res = await fetch(`${BASE_URL}/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: process.env.CAMPAY_APP_USERNAME,
      password: process.env.CAMPAY_APP_PASSWORD,
    }),
  });

  if (!res.ok) {
    throw new Error(`Campay token request failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { token: string };
  // Campay tokens are short-lived; refresh a little early to be safe.
  cachedToken = { token: data.token, expiresAt: Date.now() + 4 * 60 * 1000 };
  return data.token;
}

/** Normalizes a local phone number (e.g. "670303644") to Campay's expected
 * "2376XXXXXXXX" format. Adjust if customers may enter Orange numbers too --
 * Campay's collect endpoint auto-detects operator from the prefix. */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("237")) return digits;
  if (digits.length === 9) return `237${digits}`;
  return digits;
}

async function initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
  const token = await getToken();

  const res = await fetch(`${BASE_URL}/collect/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({
      amount: String(input.amountXaf),
      currency: "XAF",
      from: normalizePhone(input.payerPhone),
      description: input.description,
      external_reference: input.referenceId,
    }),
  });

  if (!res.ok) {
    throw new Error(`Campay collect request failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { reference: string; status?: string };

  return {
    providerReference: data.reference,
    status: "pending", // the customer still has to approve the USSD prompt on their phone
  };
}

async function checkTransactionStatus(
  reference: string
): Promise<{ status: "SUCCESSFUL" | "FAILED" | "PENDING"; amount: string }> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/transaction/${reference}/`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Campay transaction check failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function verifyWebhook(_req: Request, rawBody: string): Promise<VerifyWebhookResult> {
  const payload = JSON.parse(rawBody) as {
    reference: string;
    status: string;
    amount: string;
    external_reference?: string;
  };

  // Don't trust the webhook body's status field on its own -- re-query the
  // transaction status server-to-server so a spoofed POST can't fake "SUCCESS".
  const verified = await checkTransactionStatus(payload.reference);

  const status =
    verified.status === "SUCCESSFUL"
      ? "success"
      : verified.status === "FAILED"
      ? "failed"
      : "pending";

  return {
    providerReference: payload.reference,
    status,
    amountXaf: Number(verified.amount),
    rawPayload: payload,
  };
}

export const campayProvider: PaymentProvider = {
  name: "campay",
  initiate,
  verifyWebhook,
};
