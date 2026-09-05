import "server-only";
import type { PaymentProvider } from "./types";
import { campayProvider } from "./campay";

// Swap providers here (or fully via env) once CinetPay/NotchPay adapters are
// added -- nothing outside this file needs to change.
const PROVIDERS: Record<string, PaymentProvider> = {
  campay: campayProvider,
  // cinetpay: cinetpayProvider,
  // notchpay: notchpayProvider,
};

export function getPaymentProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER || "campay";
  const provider = PROVIDERS[name];
  if (!provider) {
    throw new Error(`Unknown PAYMENT_PROVIDER "${name}"`);
  }
  return provider;
}

export * from "./types";
