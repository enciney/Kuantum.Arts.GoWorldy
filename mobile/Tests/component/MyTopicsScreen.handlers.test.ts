/**
 * Component Handler Testleri — MyTopicsScreen
 *
 * React render gerektirmez. Konularım ekranındaki veri yükleme mantığını test eder.
 */

import { ApiError } from "../../src/services/api";
import { loadMyTopics } from "../../src/screens/main/myTopicsHandlers";

const MOCK_TOPICS = [
  {
    id: "topic-1",
    title: "Almanya vize süreci nasıl?",
    status: "approved",
    isPinned: true,
    commentCount: 5,
    createdAt: "2024-01-10T10:00:00Z",
  },
  {
    id: "topic-2",
    title: "Hollanda için dil şartı",
    status: "pending",
    isPinned: false,
    commentCount: 0,
    createdAt: "2024-01-15T08:00:00Z",
  },
];

// ── loadMyTopics() ────────────────────────────────────────────────────────────

describe("loadMyTopics() — Konularım ekranı yükleme", () => {
  it("MT-01: token varsa myTopics çağrılır ve dönen liste iletilir", async () => {
    const mockMyTopics = jest.fn().mockResolvedValue(MOCK_TOPICS);
    const result = await loadMyTopics("tok123", { myTopics: mockMyTopics } as any);
    expect(mockMyTopics).toHaveBeenCalledWith("tok123");
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("topic-1");
    expect(result[1].status).toBe("pending");
  });

  it("MT-02: token yoksa (boş string) myTopics hiç çağrılmaz ve boş dizi döner", async () => {
    const mockMyTopics = jest.fn();
    const result = await loadMyTopics("", { myTopics: mockMyTopics } as any);
    expect(mockMyTopics).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("MT-03: API hata verince fırlatır — ekran hata banner'ı gösterir", async () => {
    const mockMyTopics = jest.fn().mockRejectedValue(new ApiError("Yetkisiz", 401));
    await expect(
      loadMyTopics("tok123", { myTopics: mockMyTopics } as any)
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("MT-04: isPinned=true olan konu verisi olduğu gibi aktarılır", async () => {
    const mockMyTopics = jest.fn().mockResolvedValue(MOCK_TOPICS);
    const result = await loadMyTopics("tok123", { myTopics: mockMyTopics } as any);
    const pinned = result.find((t) => t.isPinned);
    expect(pinned).toBeDefined();
    expect(pinned?.id).toBe("topic-1");
  });

  it("MT-05: boş liste döndüğünde boş dizi iletilir", async () => {
    const mockMyTopics = jest.fn().mockResolvedValue([]);
    const result = await loadMyTopics("tok123", { myTopics: mockMyTopics } as any);
    expect(result).toEqual([]);
  });
});
