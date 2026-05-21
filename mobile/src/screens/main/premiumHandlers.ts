/**
 * PremiumScreen business logic — React'tan bağımsız, doğrudan test edilebilir.
 * Bileşen bu fonksiyonları çağırır; testler de aynı fonksiyonları mock API ile çağırır.
 */

import { api as defaultApi } from "../../services/api";

export interface PurchaseParams {
  productType: string;
  priceId?: string;
  token: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface PurchaseResult {
  url: string;
}

export interface PackagesResult {
  premium: {
    id: string;
    name: string;
    description?: string;
    days: number;
    priceTL: number;
    features?: string[];
    isSubscription?: boolean;
    subscriptionDiscountPercent?: number;
  }[];
}

/**
 * Paket listesini API'dan yükler.
 */
export async function loadPackages(
  apiPayment: typeof defaultApi.payment = defaultApi.payment
): Promise<PackagesResult> {
  return apiPayment.getPackages();
}

/**
 * Ödeme checkout'unu başlatır ve Stripe URL'ini döner.
 * Alert ve navigation bu fonksiyonun dışında kalır.
 */
export async function executePurchase(
  params: PurchaseParams,
  apiPayment: typeof defaultApi.payment = defaultApi.payment
): Promise<PurchaseResult> {
  if (!params.token) throw new Error("Token gerekli");

  const { url } = await apiPayment.checkout(
    {
      productType: params.productType,
      priceId: params.priceId,
      successUrl: params.successUrl ?? "goworldy://payment/success",
      cancelUrl: params.cancelUrl ?? "goworldy://payment/cancel",
    },
    params.token
  );

  return { url };
}

/**
 * Ödeme checkout'unu başlatır ve dönen Stripe URL'ini tarayıcıda açar.
 * Linker dependency injection ile test edilebilir — gerçek Linking.openURL testlerde mock'lanır.
 */
export async function executePurchaseAndOpen(
  params: PurchaseParams,
  apiPayment: typeof defaultApi.payment = defaultApi.payment,
  linker?: { openURL: (url: string) => Promise<void> }
): Promise<void> {
  const { url } = await executePurchase(params, apiPayment);
  if (!url) throw new Error("Geçersiz ödeme URL'i");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const opener = linker ?? (require("react-native").Linking as { openURL: (url: string) => Promise<void> });
  await opener.openURL(url);
}
