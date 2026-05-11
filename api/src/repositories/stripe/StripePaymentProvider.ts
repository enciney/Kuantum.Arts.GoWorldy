import Stripe from "stripe";
import { IPaymentProvider } from "../interfaces";
import { config } from "../../config";

export class StripePaymentProvider implements IPaymentProvider {
  private _stripe: Stripe | null = null;

  private get stripe(): Stripe {
    if (!this._stripe) {
      if (!config.stripe.secretKey) {
        throw new Error("STRIPE_SECRET_KEY tanımlı değil. .env dosyanızı kontrol edin.");
      }
      this._stripe = new Stripe(config.stripe.secretKey);
    }
    return this._stripe;
  }

  async createCheckoutSession(params: {
    userId: string;
    priceId: string;
    productType: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: { userId: params.userId, productType: params.productType },
    });
    return { url: session.url! };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const event = this.stripe.webhooks.constructEvent(payload, signature, config.stripe.webhookSecret);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      return {
        event: event.type,
        userId: session.metadata?.userId,
        productType: session.metadata?.productType,
      };
    }
    return { event: event.type };
  }
}
