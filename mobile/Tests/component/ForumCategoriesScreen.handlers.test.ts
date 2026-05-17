import { loadCategories } from "../../src/screens/main/forumCategoriesHandlers";

const mockCategories = [
  { id: "c1", countryId: "de", name: "Vize", topicCount: 10 },
  { id: "c2", countryId: "de", name: "Konut", topicCount: 5 },
];

describe("loadCategories()", () => {
  it("FC-01: token ve countryId varken kategoriler döner", async () => {
    const mockGet = jest.fn().mockResolvedValue(mockCategories);
    const result = await loadCategories("de", "tok123", { getCategories: mockGet } as any);
    expect(mockGet).toHaveBeenCalledWith("de", "tok123");
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Vize");
  });

  it("FC-02: token yoksa boş dizi döner — API çağrılmaz", async () => {
    const mockGet = jest.fn();
    const result = await loadCategories("de", "", { getCategories: mockGet } as any);
    expect(result).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("FC-03: countryId yoksa boş dizi döner — API çağrılmaz", async () => {
    const mockGet = jest.fn();
    const result = await loadCategories("", "tok123", { getCategories: mockGet } as any);
    expect(result).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("FC-04: API hatası fırlatılır", async () => {
    const mockGet = jest.fn().mockRejectedValue(new Error("Sunucu hatası"));
    await expect(
      loadCategories("de", "tok123", { getCategories: mockGet } as any)
    ).rejects.toThrow("Sunucu hatası");
  });

  it("FC-05: API boş dizi dönerse boş dizi iletilir", async () => {
    const mockGet = jest.fn().mockResolvedValue([]);
    const result = await loadCategories("de", "tok123", { getCategories: mockGet } as any);
    expect(result).toEqual([]);
  });
});
