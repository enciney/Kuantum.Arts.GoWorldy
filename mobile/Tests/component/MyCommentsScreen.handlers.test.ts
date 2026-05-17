/**
 * Component Handler Testleri — MyCommentsScreen
 *
 * React render gerektirmez. Yorumlarım ekranındaki veri yükleme mantığını test eder.
 */

import { ApiError } from "../../src/services/api";
import { loadMyComments } from "../../src/screens/main/myCommentsHandlers";

const MOCK_COMMENTS = [
  {
    id: "comment-1",
    topicId: "topic-1",
    topicTitle: "Almanya vize süreci nasıl?",
    content: "Ben 3 ay beklettim, normal süreç bu.",
    createdAt: "2024-01-12T14:00:00Z",
  },
  {
    id: "comment-2",
    topicId: "topic-2",
    topicTitle: "Hollanda için dil şartı",
    content: "B1 Hollandaca yeterli.",
    createdAt: "2024-01-18T09:30:00Z",
  },
];

// ── loadMyComments() ──────────────────────────────────────────────────────────

describe("loadMyComments() — Yorumlarım ekranı yükleme", () => {
  it("MC-01: token varsa myComments çağrılır ve dönen liste iletilir", async () => {
    const mockMyComments = jest.fn().mockResolvedValue(MOCK_COMMENTS);
    const result = await loadMyComments("tok123", { myComments: mockMyComments } as any);
    expect(mockMyComments).toHaveBeenCalledWith("tok123");
    expect(result).toHaveLength(2);
    expect(result[0].topicTitle).toBe("Almanya vize süreci nasıl?");
  });

  it("MC-02: token yoksa myComments hiç çağrılmaz ve boş dizi döner", async () => {
    const mockMyComments = jest.fn();
    const result = await loadMyComments("", { myComments: mockMyComments } as any);
    expect(mockMyComments).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("MC-03: API hata verince fırlatır — ekran hata mesajı gösterir", async () => {
    const mockMyComments = jest.fn().mockRejectedValue(new ApiError("Sunucu hatası", 500));
    await expect(
      loadMyComments("tok123", { myComments: mockMyComments } as any)
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("MC-04: yorum içeriği ve topicId doğru aktarılır", async () => {
    const mockMyComments = jest.fn().mockResolvedValue(MOCK_COMMENTS);
    const result = await loadMyComments("tok123", { myComments: mockMyComments } as any);
    expect(result[0].topicId).toBe("topic-1");
    expect(result[0].content).toBe("Ben 3 ay beklettim, normal süreç bu.");
  });

  it("MC-05: boş liste döndüğünde boş dizi iletilir", async () => {
    const mockMyComments = jest.fn().mockResolvedValue([]);
    const result = await loadMyComments("tok123", { myComments: mockMyComments } as any);
    expect(result).toEqual([]);
  });
});
