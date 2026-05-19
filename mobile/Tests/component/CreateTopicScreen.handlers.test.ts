import {
  validateTopicTitle,
  canCreateTopicFree,
  createTopic,
  buildPostCreateAction,
} from "../../src/screens/main/createTopicHandlers";

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
    expect(mockCreate).toHaveBeenCalledWith("cat1", "Bu konu başlığıdır", "tok", undefined);
    expect(result.id).toBe("tp1");
    expect(result.status).toBe("open");
  });

  it("CT-13: başlık trim edilir", async () => {
    const mockCreate = jest.fn().mockResolvedValue({ id: "tp2", status: "open" });
    await createTopic("cat1", "  Başlık metni   ", "tok", { createTopic: mockCreate } as any);
    expect(mockCreate).toHaveBeenCalledWith("cat1", "Başlık metni", "tok", undefined);
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

  it("CT-17: content parametresi trim edilip API'ye iletilir", async () => {
    const mockCreate = jest.fn().mockResolvedValue({ id: "tp3", status: "pending" });
    await createTopic("cat1", "Bu konu başlığıdır", "tok", { createTopic: mockCreate } as any, "  detay  ");
    expect(mockCreate).toHaveBeenCalledWith("cat1", "Bu konu başlığıdır", "tok", "detay");
  });

  it("CT-18: boş content undefined olarak iletilir", async () => {
    const mockCreate = jest.fn().mockResolvedValue({ id: "tp4", status: "pending" });
    await createTopic("cat1", "Bu konu başlığıdır", "tok", { createTopic: mockCreate } as any, "   ");
    expect(mockCreate).toHaveBeenCalledWith("cat1", "Bu konu başlığıdır", "tok", undefined);
  });
});

describe("buildPostCreateAction()", () => {
  it("CT-19: staff için 'yayınlandı' success toast döner", () => {
    const a = buildPostCreateAction({ status: "approved" }, true);
    expect(a.toast.variant).toBe("success");
    expect(a.toast.message).toMatch(/yayınlandı/i);
    expect(a.navigate).toBe("goBack");
  });

  it("CT-20: normal kullanıcı pending → info 'incelemeye alındı'", () => {
    const a = buildPostCreateAction({ status: "pending" }, false);
    expect(a.toast.variant).toBe("info");
    expect(a.toast.message).toMatch(/incelemeye/i);
    expect(a.navigate).toBe("goBack");
  });

  it("CT-21: status approved (premium kullanıcı) → success", () => {
    const a = buildPostCreateAction({ status: "approved" }, false);
    expect(a.toast.variant).toBe("success");
    expect(a.navigate).toBe("goBack");
  });

  it("CT-22: navigate her zaman goBack — değişmemeli", () => {
    expect(buildPostCreateAction({ status: "approved" }, true).navigate).toBe("goBack");
    expect(buildPostCreateAction({ status: "pending" }, false).navigate).toBe("goBack");
  });
});
