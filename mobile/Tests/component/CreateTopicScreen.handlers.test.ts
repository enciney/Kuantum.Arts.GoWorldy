import { validateTopicTitle, canCreateTopicFree, createTopic } from "../../src/screens/main/createTopicHandlers";

describe("validateTopicTitle()", () => {
  it("CT-01: 10+ karakter başlık geçerlidir", () => {
    expect(validateTopicTitle("Bu bir test konusu")).toEqual({ valid: true });
  });

  it("CT-02: boş başlık geçersizdir", () => {
    const r = validateTopicTitle("");
    expect(r.valid).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it("CT-03: 9 karakter başlık çok kısa", () => {
    const r = validateTopicTitle("123456789");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/10/);
  });

  it("CT-04: tam 10 karakter geçerlidir", () => {
    expect(validateTopicTitle("1234567890")).toEqual({ valid: true });
  });

  it("CT-05: sadece boşluktan oluşan başlık geçersizdir", () => {
    const r = validateTopicTitle("          ");
    expect(r.valid).toBe(false);
  });
});

describe("canCreateTopicFree()", () => {
  it("CT-06: admin ücretsiz oluşturabilir", () => {
    expect(canCreateTopicFree("admin")).toBe(true);
  });

  it("CT-07: moderator ücretsiz oluşturabilir", () => {
    expect(canCreateTopicFree("moderator")).toBe(true);
  });

  it("CT-08: isPremium:true ücretsiz oluşturabilir", () => {
    expect(canCreateTopicFree("user", true)).toBe(true);
  });

  it("CT-09: normal user kredi gerektir", () => {
    expect(canCreateTopicFree("user", false)).toBe(false);
  });

  it("CT-10: rol ve isPremium undefined — kredi gerekli", () => {
    expect(canCreateTopicFree()).toBe(false);
  });

  it("CT-11: isPremium:false admin değilse ücretli", () => {
    expect(canCreateTopicFree("user", false)).toBe(false);
  });
});

describe("createTopic()", () => {
  it("CT-12: geçerli parametrelerle konu oluşturulur", async () => {
    const mockCreate = jest.fn().mockResolvedValue({ id: "tp1", status: "open" });
    const result = await createTopic("cat1", "Bu konu başlığıdır", "tok", { createTopic: mockCreate } as any);
    expect(mockCreate).toHaveBeenCalledWith("cat1", "Bu konu başlığıdır", "tok");
    expect(result.id).toBe("tp1");
    expect(result.status).toBe("open");
  });

  it("CT-13: başlık trim edilir", async () => {
    const mockCreate = jest.fn().mockResolvedValue({ id: "tp2", status: "open" });
    await createTopic("cat1", "  Başlık metni   ", "tok", { createTopic: mockCreate } as any);
    expect(mockCreate).toHaveBeenCalledWith("cat1", "Başlık metni", "tok");
  });

  it("CT-14: token yoksa fırlatır — API çağrılmaz", async () => {
    const mockCreate = jest.fn();
    await expect(
      createTopic("cat1", "Başlık metni", "", { createTopic: mockCreate } as any)
    ).rejects.toThrow("Token gerekli");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("CT-15: categoryId yoksa fırlatır — API çağrılmaz", async () => {
    const mockCreate = jest.fn();
    await expect(
      createTopic("", "Başlık metni", "tok", { createTopic: mockCreate } as any)
    ).rejects.toThrow("Kategori gerekli");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("CT-16: API hatası fırlatılır", async () => {
    const mockCreate = jest.fn().mockRejectedValue(new Error("Konu oluşturulamadı"));
    await expect(
      createTopic("cat1", "Başlık metni", "tok", { createTopic: mockCreate } as any)
    ).rejects.toThrow("Konu oluşturulamadı");
  });
});
