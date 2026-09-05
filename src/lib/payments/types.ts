// Provider-agnostic payment interface. Every MoMo aggregator (Campay,
// CinetPay, NotchPay) implements this so the rest of the app (checkout API,
// webhook handler) never needs to know which one is active. Switching
// providers later = pointing PAYMENT_PROVIDER at a different implementation,
// not a rewrite.

export type ReferenceType = "enrollment" | "order";

export interface InitiatePaymentInput {
  amountXaf: number;
  payerPhone: string; // MoMo number to charge, e.g. "670303644"
  referenceType: ReferenceType;
  referenceId: string; // enrollments.id or orders.id
  description: string;
}

export interface InitiatePaymentResult {
  providerReference: string; // the id we store on payments.provider_reference
  status: "pending" | "success" | "failed";
  redirectUrl?: string; // some providers require a redirect/USSD prompt step
}

export interface VerifyWebhookResult {
  providerReference: string;
  status: "success" | "failed" | "pending";
  amountXaf: number;
  rawPayload: unknown;
}

export interface PaymentProvider {
  name: "campay" | "cinetpay" | "notchpay";
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  /** Verifies a webhook request's authenticity and normalizes its payload. */
  verifyWebhook(req: Request, rawBody: string): Promise<VerifyWebhookResult>;
}
