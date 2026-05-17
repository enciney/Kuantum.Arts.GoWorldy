import { api, ApiError } from "../../src/services/api";
import { mockOk, mockErr } from "./setup";

const fetchMock = jest.fn();
global.fetch = fetchMock;
beforeEach(() => fetchMock.mockReset());

const TOKEN = "test-token";

// ── PM-01: Paket listesi ──────────────────────────────────────────────────────
describe("GET /payment/packages", () => {
  it("PM-01: kredi ve premium paketleri döner", async () => {
    const packages = {
      credits: [
        { id: "credits_topic", name: "Konu Kredisi", credits: 50, priceTL: 29 },
        { id: "credits_100", name: "100 Kredi", credits: 100, priceTL: 49 },
      ],
      premium: [
        { id: "premium_monthly", name: "Aylık Premium", days: 30, priceTL: 250 },
      ],
    };
    fetchMock.mockResolvedValueOnce(mockOk(packages));

    const res = await api.payment.getPackages();
    expect(res.credits).toHaveLength(2);
    expect(res.premium).toHaveLength(1);
    expect(res.premium[0].days).toBe(30);
  });

  it("PR-01: fiyatlar API'dan dinamik çekilir", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ credits: [], premium: [] }));

    await api.payment.getPackages();
    expect(fetchMock.mock.calls[0][0]).toContain("/payment/packages");
  });
});

// ── PM-07/PM-08: Checkout ─────────────────────────────────────────────────────
describe("POST /payment/checkout", () => {
  it("PM-07: geçerli planId → Stripe checkout URL döner", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ url: "https://checkout.stripe.com/pay/test" }));

    const res = await api.payment.checkout(
      { productType: "premium", priceId: "price_123", successUrl: "app://success", cancelUrl: "app://cancel" },
      TOKEN
    );
    expect(res.url).toContain("stripe.com");
  });

  it("PR-03: checkout isteği doğru body ile gönderilir", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ url: "https://checkout.stripe.com/pay/x" }));

    await api.payment.checkout(
      { productType: "credits_topic", priceId: "price_topic", successUrl: "s", cancelUrl: "c" },
      TOKEN
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.productType).toBe("credits_topic");
    expect(body.priceId).toBe("price_topic");
  });

  it("PM-08: geçersiz planId → ApiError", async () => {
    fetchMock.mockResolvedValueOnce(mockErr({ error: "Plan not found" }, 404));

    const err = await api.payment.checkout(
      { productType: "unknown", successUrl: "s", cancelUrl: "c" },
      TOKEN
    ).catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
  });

  it("auth yok → 401 ApiError", async () => {
    fetchMock.mockResolvedValueOnce(mockErr({ error: "Unauthorized" }, 401));

    await expect(
      api.payment.checkout({ productType: "premium", successUrl: "s", cancelUrl: "c" }, "")
    ).rejects.toThrow(ApiError);
  });
});

// ── PM-05: My features ────────────────────────────────────────────────────────
describe("GET /payment/my-features", () => {
  it("PM-05: kullanıcının satın aldığı özellikler listelenir", async () => {
    const features = [
      { id: "f1", userId: "u1", featureType: "credits_topic", purchasedAt: "2026-01-01", expiresAt: null },
    ];
    fetchMock.mockResolvedValueOnce(mockOk(features));

    const res = await api.payment.myFeatures(TOKEN);
    expect(res).toHaveLength(1);
    expect(res[0].featureType).toBe("credits_topic");
  });

  it("premium kullanıcı → premiumUntil içeren özellik", async () => {
    const features = [
      { id: "f2", userId: "u1", featureType: "premium_monthly", purchasedAt: "2026-01-01", expiresAt: "2026-02-01" },
    ];
    fetchMock.mockResolvedValueOnce(mockOk(features));

    const res = await api.payment.myFeatures(TOKEN);
    expect(res[0].expiresAt).toBe("2026-02-01");
  });

  it("satın alım yok → boş dizi", async () => {
    fetchMock.mockResolvedValueOnce(mockOk([]));

    const res = await api.payment.myFeatures(TOKEN);
    expect(res).toHaveLength(0);
  });
});

// ── CR-07: Kredi eksi olamaz (402) ────────────────────────────────────────────
describe("Kredi iş kuralları", () => {
  it("CR-07: yetersiz krediyle forum işlemi → 402 ApiError", async () => {
    fetchMock.mockResolvedValueOnce(mockErr({ error: "Insufficient credits" }, 402));

    const err = await api.forum.createTopic("c1", "başlık", TOKEN).catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(402);
  });

  it("CR-02: yorum için de 402 dönebilir", async () => {
    fetchMock.mockResolvedValueOnce(mockErr({ error: "Insufficient credits" }, 402));

    const err = await api.forum.createComment("t1", "yorum", TOKEN).catch(e => e);
    expect(err.status).toBe(402);
  });
});


