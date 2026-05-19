import { mergePages, dedupeById, hasMore, FavoriteTopic } from "../../src/utils/favorites";
import { loadFavorites, FAVORITES_PAGE_SIZE } from "../../src/screens/main/favoritesHandlers";
import { ApiError } from "../../src/services/api";

const MOCK_PAGE_1: FavoriteTopic[] = [
  { id: "fav-1", title: "Almanya vize", commentCount: 3, createdAt: "2024-02-01T10:00:00Z" },
  { id: "fav-2", title: "Hollanda dil şartı", commentCount: 7, createdAt: "2024-02-02T11:00:00Z" },
];

const MOCK_PAGE_2: FavoriteTopic[] = [
  { id: "fav-3", title: "İsveç oturma izni", commentCount: 1, createdAt: "2024-02-03T09:00:00Z" },
];

describe("favorites utils — mergePages / dedupeById / hasMore", () => {
  it("FAV-U-01: mergePages boş prev ile next'i olduğu gibi döner", () => {
    expect(mergePages<FavoriteTopic>([], MOCK_PAGE_1)).toEqual(MOCK_PAGE_1);
  });

  it("FAV-U-02: mergePages iki sayfayı sırayla birleştirir", () => {
    const merged = mergePages(MOCK_PAGE_1, MOCK_PAGE_2);
    expect(merged).toHaveLength(3);
    expect(merged.map((x) => x.id)).toEqual(["fav-1", "fav-2", "fav-3"]);
  });

  it("FAV-U-03: mergePages tekrarlanan id'leri tekilleştirir", () => {
    const dup: FavoriteTopic[] = [
      { id: "fav-2", title: "tekrar", commentCount: 0, createdAt: "x" },
      { id: "fav-3", title: "İsveç oturma izni", commentCount: 1, createdAt: "2024-02-03T09:00:00Z" },
    ];
    const merged = mergePages(MOCK_PAGE_1, dup);
    expect(merged).toHaveLength(3);
    expect(merged.map((x) => x.id)).toEqual(["fav-1", "fav-2", "fav-3"]);
  });

  it("FAV-U-04: dedupeById tüm id'leri benzersizleştirir", () => {
    const items = [
      { id: "a" },
      { id: "b" },
      { id: "a" },
    ];
    expect(dedupeById(items)).toEqual([{ id: "a" }, { id: "b" }]);
  });

  it("FAV-U-05: hasMore — tam sayfa geldiyse devam edilebilir, eksikse durulur", () => {
    expect(hasMore(20, 20)).toBe(true);
    expect(hasMore(19, 20)).toBe(false);
    expect(hasMore(0, 20)).toBe(false);
  });
});

describe("loadFavorites() — Favorilerim ekranı yükleme", () => {
  it("FAV-H-01: token varsa myFavorites(token, limit, offset) çağrılır", async () => {
    const mockMyFavorites = jest.fn().mockResolvedValue(MOCK_PAGE_1);
    const result = await loadFavorites("tok", 0, FAVORITES_PAGE_SIZE, { myFavorites: mockMyFavorites } as any);
    expect(mockMyFavorites).toHaveBeenCalledWith("tok", FAVORITES_PAGE_SIZE, 0);
    expect(result).toEqual(MOCK_PAGE_1);
  });

  it("FAV-H-02: token yoksa çağrı yapılmaz, boş dizi döner (empty state için)", async () => {
    const mockMyFavorites = jest.fn();
    const result = await loadFavorites("", 0, 20, { myFavorites: mockMyFavorites } as any);
    expect(mockMyFavorites).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("FAV-H-03: backend boş dönerse boş dizi iletilir (empty state tetiklenir)", async () => {
    const mockMyFavorites = jest.fn().mockResolvedValue([]);
    const result = await loadFavorites("tok", 0, 20, { myFavorites: mockMyFavorites } as any);
    expect(result).toEqual([]);
  });

  it("FAV-H-04: end-reached için offset ilerletilerek ikinci sayfa çekilir", async () => {
    const mockMyFavorites = jest.fn().mockResolvedValue(MOCK_PAGE_2);
    const result = await loadFavorites("tok", 20, 20, { myFavorites: mockMyFavorites } as any);
    expect(mockMyFavorites).toHaveBeenCalledWith("tok", 20, 20);
    expect(result).toEqual(MOCK_PAGE_2);
  });

  it("FAV-H-05: API hata verirse ApiError fırlatır (ekran error state'e geçer)", async () => {
    const mockMyFavorites = jest.fn().mockRejectedValue(new ApiError("Yetkisiz", 401));
    await expect(
      loadFavorites("tok", 0, 20, { myFavorites: mockMyFavorites } as any)
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("FAV-H-06: pull-to-refresh akışı offset=0 ile çağırır", async () => {
    const mockMyFavorites = jest.fn().mockResolvedValue(MOCK_PAGE_1);
    await loadFavorites("tok", 0, FAVORITES_PAGE_SIZE, { myFavorites: mockMyFavorites } as any);
    expect(mockMyFavorites).toHaveBeenCalledWith("tok", FAVORITES_PAGE_SIZE, 0);
  });
});
