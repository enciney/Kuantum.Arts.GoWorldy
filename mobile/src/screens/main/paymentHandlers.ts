import { api as defaultApi } from "../../services/api";

export interface PaymentResult {
  ok: boolean;
  isPremium: boolean;
  premiumUntil: string | null;
}

export async function processPayment(
  productId: string,
  token: string,
  apiPayment: typeof defaultApi.payment = defaultApi.payment
): Promise<PaymentResult> {
  if (!token) throw new Error("Token gerekli");
  if (!productId) throw new Error("Ürün seçilmedi");
  return apiPayment.process(productId, token);
}
