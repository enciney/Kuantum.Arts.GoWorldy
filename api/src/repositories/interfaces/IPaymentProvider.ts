export interface IPaymentProvider {
  createCheckoutSession(params: {
    userId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string }>;

  handleWebhook(payload: Buffer, signature: string): Promise<{
    event: string;
    userId?: string;
    productId?: string;
  }>;
}
