/**
 * Component Handler Testleri — PremiumScreen
 *
 * React render gerektirmez. Butona basılınca tetiklenen iş mantığını test eder.
 * "Satın Al" butonuna basıldığında doğru kod çalışıyor mu?
 */

import { ApiError } from "../../src/services/api";
import { loadPackages, executePurchase, executePurchaseAndOpen } from "../../src/screens/main/premiumHandlers";

// ── loadPackages() — Ekran açılınca paketler yükleniyor mu? ──────────────────

describe("loadPackages() — ekran açılışı", () => {
  it("HP-01: API'dan dönen paketleri olduğu gibi iletir", async () => {
    const mockGet = jest.fn().mockResolvedValue({
      credits: [{ id: "credits_topic", name: "Konu Kredisi", credits: 50, priceTL: 29 }],
      premium: [{ id: "premium_monthly", name: "Aylık Premium", days: 30, priceTL: 250 }],
    });
    const result = await loadPackages({ getPackages: mockGet } as any);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(result.credits).toHaveLength(1);
    expect(result.premium[0].id).toBe("premium_monthly");
  });

  it("HP-02: API hata verince fırlatır — ekran hata banner'ı gösterir", async () => {
    const mockGet = jest.fn().mockRejectedValue(new Error("network error"));
    await expect(loadPackages({ getPackages: mockGet } as any)).rejects.toThrow("network error");
  });
});

// ── executePurchase() — "Satın Al" butonuna basılınca ne olur? ───────────────

describe("executePurchase() — Satın Al butonu", () => {
  it("HP-03: doğru productType ve priceId ile checkout çağrılır", async () => {
    const mockCheckout = jest.fn().mockResolvedValue({ url: "https://stripe.com/pay/test" });
    const result = await executePurchase(
      { productType: "premium_monthly", priceId: "price_xyz", token: "tok123" },
      { checkout: mockCheckout } as any
    );
    expect(mockCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ productType: "premium_monthly", priceId: "price_xyz" }),
      "tok123"
    );
    expect(result.url).toBe("https://stripe.com/pay/test");
  });

  it("HP-04: priceId opsiyonel — gönderilmeden de çalışır", async () => {
    const mockCheckout = jest.fn().mockResolvedValue({ url: "https://stripe.com/pay/x" });
    await executePurchase(
      { productType: "credits_100", token: "tok123" },
      { checkout: mockCheckout } as any
    );
    const body = mockCheckout.mock.calls[0][0];
    expect(body.priceId).toBeUndefined();
    expect(body.productType).toBe("credits_100");
  });

  it("HP-05: token yoksa checkout hiç çağrılmaz", async () => {
    const mockCheckout = jest.fn();
    await expect(
      executePurchase({ productType: "premium_monthly", token: "" }, { checkout: mockCheckout } as any)
    ).rejects.toThrow("Token gerekli");
    expect(mockCheckout).not.toHaveBeenCalled();
  });

  it("HP-06: Stripe hatası fırlatılır — ekran hata mesajı gösterir", async () => {
    const mockCheckout = jest.fn().mockRejectedValue(new ApiError("No such price", 402));
    await expect(
      executePurchase({ productType: "credits_topic", priceId: "bad_price", token: "tok" }, { checkout: mockCheckout } as any)
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("HP-07: successUrl ve cancelUrl deep link formatında gönderilir", async () => {
    const mockCheckout = jest.fn().mockResolvedValue({ url: "https://stripe.com/pay/y" });
    await executePurchase(
      { productType: "premium_monthly", token: "tok" },
      { checkout: mockCheckout } as any
    );
    const body = mockCheckout.mock.calls[0][0];
    expect(body.successUrl).toBe("goworldy://payment/success");
    expect(body.cancelUrl).toBe("goworldy://payment/cancel");
  });
});

// ── executePurchaseAndOpen() — URL gerçekten açılıyor mu? ────────────────────
//
// Asıl kritik test: checkout URL döndükten sonra Linking.openURL çağrılmalı.
// Bu fonksiyon test edilmezse "return { url }" kodu çalışır ama tarayıcı açılmaz
// ve test yanlış geçer.

describe("executePurchaseAndOpen() — URL tarayıcıda açılıyor mu?", () => {
  it("HP-08: checkout URL'ini Linking.openURL'e iletir", async () => {
    const mockCheckout = jest.fn().mockResolvedValue({ url: "https://stripe.com/pay/test" });
    const mockOpenURL = jest.fn().mockResolvedValue(undefined);
    await executePurchaseAndOpen(
      { productType: "premium_monthly", token: "tok123" },
      { checkout: mockCheckout } as any,
      { openURL: mockOpenURL }
    );
    expect(mockOpenURL).toHaveBeenCalledWith("https://stripe.com/pay/test");
  });

  it("HP-09: checkout hata verince openURL hiç çağrılmaz", async () => {
    const mockCheckout = jest.fn().mockRejectedValue(new ApiError("Ödeme hatası", 402));
    const mockOpenURL = jest.fn();
    await expect(
      executePurchaseAndOpen(
        { productType: "premium_monthly", token: "tok123" },
        { checkout: mockCheckout } as any,
        { openURL: mockOpenURL }
      )
    ).rejects.toBeInstanceOf(ApiError);
    expect(mockOpenURL).not.toHaveBeenCalled();
  });

  it("HP-10: checkout boş URL döndürürse fırlatır — openURL çağrılmaz", async () => {
    const mockCheckout = jest.fn().mockResolvedValue({ url: "" });
    const mockOpenURL = jest.fn();
    await expect(
      executePurchaseAndOpen(
        { productType: "premium_monthly", token: "tok123" },
        { checkout: mockCheckout } as any,
        { openURL: mockOpenURL }
      )
    ).rejects.toThrow("Geçersiz ödeme URL'i");
    expect(mockOpenURL).not.toHaveBeenCalled();
  });

  it("HP-11: Linking.openURL hata verince fırlatır — ödeme ekranı açılamadı alert'i gösterir", async () => {
    const mockCheckout = jest.fn().mockResolvedValue({ url: "https://stripe.com/pay/test" });
    const mockOpenURL = jest.fn().mockRejectedValue(new Error("Tarayıcı açılamadı"));
    await expect(
      executePurchaseAndOpen(
        { productType: "premium_monthly", token: "tok123" },
        { checkout: mockCheckout } as any,
        { openURL: mockOpenURL }
      )
    ).rejects.toThrow("Tarayıcı açılamadı");
  });
});
