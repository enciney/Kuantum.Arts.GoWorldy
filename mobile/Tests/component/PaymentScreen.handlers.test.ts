import { processPayment } from "../../src/screens/main/paymentHandlers";

describe("processPayment()", () => {
  const mockResult = {
    ok: true,
    credits: 100,
    isPremium: false,
    premiumUntil: null,
  };

  it("PP-01: geçerli productId ve token ile API çağrılır", async () => {
    const mockProcess = jest.fn().mockResolvedValue(mockResult);
    const result = await processPayment("credits_pack", "tok123", { process: mockProcess } as any);
    expect(mockProcess).toHaveBeenCalledWith("credits_pack", "tok123");
    expect(result.ok).toBe(true);
    expect(result.credits).toBe(100);
  });

  it("PP-02: token yoksa fırlatır — API çağrılmaz", async () => {
    const mockProcess = jest.fn();
    await expect(processPayment("credits_pack", "", { process: mockProcess } as any)).rejects.toThrow(
      "Token gerekli"
    );
    expect(mockProcess).not.toHaveBeenCalled();
  });

  it("PP-03: productId yoksa fırlatır — API çağrılmaz", async () => {
    const mockProcess = jest.fn();
    await expect(processPayment("", "tok123", { process: mockProcess } as any)).rejects.toThrow(
      "Ürün seçilmedi"
    );
    expect(mockProcess).not.toHaveBeenCalled();
  });

  it("PP-04: premium_weekly ürünü isPremium:true döndürebilir", async () => {
    const mockProcess = jest.fn().mockResolvedValue({
      ok: true,
      credits: 0,
      isPremium: true,
      premiumUntil: "2026-05-24T00:00:00Z",
    });
    const result = await processPayment("premium_weekly", "tok123", { process: mockProcess } as any);
    expect(result.isPremium).toBe(true);
    expect(result.premiumUntil).toBeTruthy();
  });

  it("PP-05: API hatası fırlatılır — ekran hata gösterir", async () => {
    const mockProcess = jest.fn().mockRejectedValue(new Error("Ödeme işlemi başarısız"));
    await expect(
      processPayment("premium_monthly", "tok123", { process: mockProcess } as any)
    ).rejects.toThrow("Ödeme işlemi başarısız");
  });

  it("PP-06: credits_pack ürünü isPremium:false döndürür", async () => {
    const mockProcess = jest.fn().mockResolvedValue({
      ok: true,
      credits: 50,
      isPremium: false,
      premiumUntil: null,
    });
    const result = await processPayment("credits_pack", "tok123", { process: mockProcess } as any);
    expect(result.isPremium).toBe(false);
    expect(result.premiumUntil).toBeNull();
  });
});
