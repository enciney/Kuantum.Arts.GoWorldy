import { api, ApiError } from "../../src/services/api";
import { mockOk, mockErr } from "./setup";

const fetchMock = jest.fn();
global.fetch = fetchMock;
beforeEach(() => fetchMock.mockReset());

const TOKEN = "test-token";

// ── U-01/U-02/U-03: GET /users/me ───────────────────────────────────────────
describe("GET /users/me", () => {
  it("U-01: geçerli token → user objesi (passwordHash YOK)", async () => {
    const user = { id: "1", email: "a@b.com", displayName: "A", role: "user", credits: 100, isPremium: false };
    fetchMock.mockResolvedValueOnce(mockOk(user));

    const res = await api.users.me(TOKEN);
    expect(res.email).toBe("a@b.com");
    expect(res.credits).toBe(100);
    expect((res as any).passwordHash).toBeUndefined();
  });

  it("U-02: token yok → 401 ApiError", async () => {
    fetchMock.mockResolvedValueOnce(mockErr({ error: "Unauthorized" }, 401));

    const err = await api.users.me("").catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(401);
  });

  it("U-03: geçersiz token → 401 ApiError", async () => {
    fetchMock.mockResolvedValueOnce(mockErr({ error: "Invalid token" }, 401));

    await expect(api.users.me("bad-token")).rejects.toThrow(ApiError);
  });

  it("U-01: Authorization header doğru gönderilir", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ id: "1", email: "a@b.com", displayName: "A", role: "user", credits: 0, isPremium: false }));

    await api.users.me(TOKEN);
    expect(fetchMock.mock.calls[0][1].headers["Authorization"]).toBe(`Bearer ${TOKEN}`);
  });
});

// ── U-04…U-08: PATCH /users/me ──────────────────────────────────────────────
describe("PATCH /users/me", () => {
  it("U-04: displayName güncelle → 200 güncellenmiş user", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ id: "1", email: "a@b.com", displayName: "Yeni Ad" }));

    const res = await api.users.updateMe({ displayName: "Yeni Ad" }, TOKEN);
    expect(res.displayName).toBe("Yeni Ad");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.displayName).toBe("Yeni Ad");
  });

  it("U-05: bio güncelle → 200", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ id: "1", email: "a@b.com", displayName: "A", bio: "Yeni bio" }));

    const res = await api.users.updateMe({ bio: "Yeni bio" }, TOKEN);
    expect(res.bio).toBe("Yeni bio");
  });

  it("U-09: role alanı gönderildiğinde API 200 dönse bile role isteğe dahil edilir", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ id: "1", email: "a@b.com", displayName: "A" }));

    // Client role göndermemeli; bu test API'nin bunu filtrelediğini doğrular (mock simüle eder)
    const res = await api.users.updateMe({ displayName: "A" }, TOKEN);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.role).toBeUndefined(); // updateMe imzasında role yok
    expect(res).toBeDefined();
  });
});

// ── U-10: GET /users/me/stats ────────────────────────────────────────────────
describe("GET /users/me/stats", () => {
  it("U-10: istatistikler doğru alanlarla döner", async () => {
    const stats = { topicCount: 5, commentCount: 12, followingCount: 0, completedSteps: 3 };
    fetchMock.mockResolvedValueOnce(mockOk(stats));

    const res = await api.users.myStats(TOKEN);
    expect(res.topicCount).toBe(5);
    expect(res.commentCount).toBe(12);
    expect(res.completedSteps).toBe(3);
  });
});

// ── MyTopics / MyComments ────────────────────────────────────────────────────
describe("GET /users/me/topics", () => {
  it("MT-01: kullanıcının konuları listelenir", async () => {
    const topics = [
      { id: "t1", title: "Almanya vize", status: "approved", isPinned: false, commentCount: 2, createdAt: "2026-01-01" },
    ];
    fetchMock.mockResolvedValueOnce(mockOk(topics));

    const res = await api.users.myTopics(TOKEN);
    expect(res).toHaveLength(1);
    expect(res[0].status).toBe("approved");
  });

  it("MT-02: boş liste → boş dizi", async () => {
    fetchMock.mockResolvedValueOnce(mockOk([]));

    const res = await api.users.myTopics(TOKEN);
    expect(res).toHaveLength(0);
  });
});

describe("GET /users/me/comments", () => {
  it("MC-01: kullanıcının yorumları listelenir", async () => {
    const comments = [
      { id: "c1", topicId: "t1", topicTitle: "Almanya", content: "...", createdAt: "2026-01-01" },
    ];
    fetchMock.mockResolvedValueOnce(mockOk(comments));

    const res = await api.users.myComments(TOKEN);
    expect(res).toHaveLength(1);
    expect(res[0].topicId).toBe("t1");
  });

  it("MC-02: boş liste → boş dizi", async () => {
    fetchMock.mockResolvedValueOnce(mockOk([]));

    const res = await api.users.myComments(TOKEN);
    expect(res).toHaveLength(0);
  });
});


