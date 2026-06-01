/**
 * Component Handler Testleri — AdminTopicsScreen
 *
 * React render gerektirmez. Admin konu moderasyon mantığını test eder:
 * bekleyen konuları listeleme, onaylama/reddetme, silme talepleri ve çözümleme.
 */

import { ApiError } from "../../src/services/api";
import {
  loadPendingTopics,
  approveTopicHandler,
  rejectTopicHandler,
  loadDeletionRequests,
  resolveDeletionRequestHandler,
} from "../../src/screens/admin/adminTopicsHandlers";

const MOCK_PENDING_TOPICS = [
  {
    id: "topic-1",
    title: "Almanya vize başvurusu",
    authorName: "Ali Veli",
    createdAt: "2024-01-20T10:00:00Z",
    status: "pending",
  },
  {
    id: "topic-2",
    title: "Hollanda çalışma izni",
    authorName: "Ayşe Kaya",
    createdAt: "2024-01-21T09:00:00Z",
    status: "pending",
  },
];

const MOCK_DELETION_REQUESTS = [
  {
    id: "del-1",
    topicId: "topic-5",
    topicTitle: "Silinecek konu",
    requestedBy: "user-10",
    reason: "Yanlış kategori",
    createdAt: "2024-01-22T08:00:00Z",
  },
];

// ── loadPendingTopics() ───────────────────────────────────────────────────────

describe("loadPendingTopics() — bekleyen konuları yükleme", () => {
  it("AT-01: token varsa getPendingTopics API çağrılır ve liste döner", async () => {
    const mockGetPendingTopics = jest
      .fn()
      .mockResolvedValue(MOCK_PENDING_TOPICS);
    const result = await loadPendingTopics("admin-tok-123", {
      getPendingTopics: mockGetPendingTopics,
    } as any);
    expect(mockGetPendingTopics).toHaveBeenCalledWith("admin-tok-123");
    expect(result.topics).toHaveLength(2);
    expect(result.topics[0].id).toBe("topic-1");
  });

  it("AT-02: API hata verirse topics boş array döner", async () => {
    const mockGetPendingTopics = jest
      .fn()
      .mockRejectedValue(new ApiError("Sunucu hatası", 500));
    const result = await loadPendingTopics("admin-tok-123", {
      getPendingTopics: mockGetPendingTopics,
    } as any);
    expect(result.topics).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it("AT-03: ağ hatasında da topics boş array döner", async () => {
    const mockGetPendingTopics = jest
      .fn()
      .mockRejectedValue(new Error("network error"));
    const result = await loadPendingTopics("admin-tok-123", {
      getPendingTopics: mockGetPendingTopics,
    } as any);
    expect(result.topics).toEqual([]);
  });
});

// ── approveTopicHandler() ─────────────────────────────────────────────────────

describe("approveTopicHandler() — konu onaylama", () => {
  it("AT-04: updateTopicStatus 'approved' ile çağrılır ve true döner", async () => {
    const mockUpdateTopicStatus = jest.fn().mockResolvedValue({ ok: true });
    const result = await approveTopicHandler("topic-1", "admin-tok-123", {
      updateTopicStatus: mockUpdateTopicStatus,
    } as any);
    expect(mockUpdateTopicStatus).toHaveBeenCalledWith("topic-1", "approved", "admin-tok-123");
    expect(result).toBe(true);
  });

  it("AT-05: API hata verirse false döner", async () => {
    const mockUpdateTopicStatus = jest
      .fn()
      .mockRejectedValue(new ApiError("Yetkisiz", 403));
    const result = await approveTopicHandler("topic-1", "admin-tok-123", {
      updateTopicStatus: mockUpdateTopicStatus,
    } as any);
    expect(result).toBe(false);
  });
});

// ── rejectTopicHandler() ──────────────────────────────────────────────────────

describe("rejectTopicHandler() — konu reddetme", () => {
  it("AT-06: updateTopicStatus 'rejected' + reason ile çağrılır ve true döner", async () => {
    const mockUpdateTopicStatus = jest.fn().mockResolvedValue({ ok: true });
    const result = await rejectTopicHandler(
      "topic-2",
      "Kurallara aykırı içerik",
      "admin-tok-123",
      { updateTopicStatus: mockUpdateTopicStatus } as any
    );
    expect(mockUpdateTopicStatus).toHaveBeenCalledWith(
      "topic-2",
      "rejected",
      "admin-tok-123",
      "Kurallara aykırı içerik"
    );
    expect(result).toBe(true);
  });

  it("AT-07: API hata verirse false döner", async () => {
    const mockUpdateTopicStatus = jest
      .fn()
      .mockRejectedValue(new ApiError("Sunucu hatası", 500));
    const result = await rejectTopicHandler(
      "topic-2",
      "Kurallara aykırı içerik",
      "admin-tok-123",
      { updateTopicStatus: mockUpdateTopicStatus } as any
    );
    expect(result).toBe(false);
  });
});

// ── loadDeletionRequests() ────────────────────────────────────────────────────

describe("loadDeletionRequests() — silme taleplerini yükleme", () => {
  it("AT-08: API başarılıysa result.requests talep listesi döner", async () => {
    const mockGetDeletionRequests = jest
      .fn()
      .mockResolvedValue(MOCK_DELETION_REQUESTS);
    const result = await loadDeletionRequests("admin-tok-123", {
      getDeletionRequests: mockGetDeletionRequests,
    } as any);
    expect(mockGetDeletionRequests).toHaveBeenCalledWith("admin-tok-123");
    expect(result.requests).toHaveLength(1);
    expect(result.requests[0].id).toBe("del-1");
  });

  it("AT-09: API hata verirse requests boş array döner", async () => {
    const mockGetDeletionRequests = jest
      .fn()
      .mockRejectedValue(new ApiError("Sunucu hatası", 500));
    const result = await loadDeletionRequests("admin-tok-123", {
      getDeletionRequests: mockGetDeletionRequests,
    } as any);
    expect(result.requests).toEqual([]);
    expect(result.error).toBeTruthy();
  });
});

// ── resolveDeletionRequestHandler() ──────────────────────────────────────────

describe("resolveDeletionRequestHandler() — silme talebini çözümleme", () => {
  it('AT-10: "approved" kararıyla API çağrılır ve başarılıysa true döner', async () => {
    const mockResolveDeletionRequest = jest
      .fn()
      .mockResolvedValue({ success: true });
    const result = await resolveDeletionRequestHandler(
      "del-1",
      "approved",
      "admin-tok-123",
      { resolveDeletionRequest: mockResolveDeletionRequest } as any
    );
    expect(mockResolveDeletionRequest).toHaveBeenCalledWith(
      "del-1",
      "approved",
      "admin-tok-123"
    );
    expect(result).toBe(true);
  });

  it('AT-11: "rejected" kararıyla API çağrılır ve başarılıysa true döner', async () => {
    const mockResolveDeletionRequest = jest
      .fn()
      .mockResolvedValue({ success: true });
    const result = await resolveDeletionRequestHandler(
      "del-1",
      "rejected",
      "admin-tok-123",
      { resolveDeletionRequest: mockResolveDeletionRequest } as any
    );
    expect(mockResolveDeletionRequest).toHaveBeenCalledWith(
      "del-1",
      "rejected",
      "admin-tok-123"
    );
    expect(result).toBe(true);
  });

  it("AT-12: API hata verirse false döner", async () => {
    const mockResolveDeletionRequest = jest
      .fn()
      .mockRejectedValue(new ApiError("Sunucu hatası", 500));
    const result = await resolveDeletionRequestHandler(
      "del-1",
      "approved",
      "admin-tok-123",
      { resolveDeletionRequest: mockResolveDeletionRequest } as any
    );
    expect(result).toBe(false);
  });
});
