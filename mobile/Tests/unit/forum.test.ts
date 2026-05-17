import { api, ApiError } from "../../src/services/api";
import { mockOk, mockErr } from "./setup";

const fetchMock = jest.fn();
global.fetch = fetchMock;
beforeEach(() => fetchMock.mockReset());

const TOKEN = "test-token";

// ── F-01: Ülkeler ────────────────────────────────────────────────────────────
describe("GET /forum/countries", () => {
  it("F-01: ülkeler topicCount ile listelenir", async () => {
    const countries = [
      { id: "de", name: "Almanya", code: "DE", topicCount: 10 },
      { id: "nl", name: "Hollanda", code: "NL", topicCount: 5 },
    ];
    fetchMock.mockResolvedValueOnce(mockOk(countries));

    const res = await api.forum.getCountries(TOKEN);
    expect(res).toHaveLength(2);
    expect(res[0].topicCount).toBe(10);
  });
});

// ── F-02/F-03: Kategoriler ───────────────────────────────────────────────────
describe("GET /forum/countries/:id/categories", () => {
  it("F-02: geçerli countryId → kategoriler döner", async () => {
    const cats = [{ id: "c1", countryId: "de", name: "Vize", topicCount: 3 }];
    fetchMock.mockResolvedValueOnce(mockOk(cats));

    const res = await api.forum.getCategories("de", TOKEN);
    expect(res[0].name).toBe("Vize");
  });

  it("FC-03: geçersiz countryId → boş dizi", async () => {
    fetchMock.mockResolvedValueOnce(mockOk([]));

    const res = await api.forum.getCategories("nonexistent", TOKEN);
    expect(res).toHaveLength(0);
  });
});

// ── F-04/F-05: Konular ───────────────────────────────────────────────────────
describe("GET /forum/categories/:id/topics", () => {
  it("F-04: sadece approved konular döner", async () => {
    const topics = {
      data: [
        { id: "t1", title: "Blue Card", authorId: "u1", isPinned: false, status: "approved", createdAt: "2026-01-01", commentCount: 2, upvotes: 5, hasUpvoted: false },
      ],
      total: 1, page: 1, totalPages: 1,
    };
    fetchMock.mockResolvedValueOnce(mockOk(topics));

    const res = await api.forum.getTopics("c1", TOKEN);
    expect(res.data).toHaveLength(1);
    expect(res.data[0].status).toBe("approved");
  });

  it("FT-05: page parametresi URL'e eklenir", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ data: [], total: 0, page: 2, totalPages: 1 }));

    await api.forum.getTopics("c1", TOKEN, 2, 10);
    expect(fetchMock.mock.calls[0][0]).toContain("page=2");
    expect(fetchMock.mock.calls[0][0]).toContain("limit=10");
  });
});

// ── F-07/F-08/F-09/F-10/F-11: Konu oluşturma ────────────────────────────────
describe("POST /forum/topics", () => {
  it("F-07: başarılı konu oluşturma → id + status", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ id: "new-topic", status: "pending" }));

    const res = await api.forum.createTopic("c1", "Blue Card başvurusu", TOKEN);
    expect(res.id).toBe("new-topic");
    expect(res.status).toBe("pending");
  });

  it("CT-08: normal kullanıcı konusu status=pending oluşur", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ id: "t2", status: "pending" }));

    const res = await api.forum.createTopic("c1", "Yeni konu", TOKEN, "İçerik");
    expect(res.status).toBe("pending");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.title).toBe("Yeni konu");
    expect(body.content).toBe("İçerik");
    expect(body.categoryId).toBe("c1");
  });

  it("F-09/F-11: yetersiz kredi → 402 ApiError", async () => {
    fetchMock.mockResolvedValueOnce(mockErr({ error: "Insufficient credits" }, 402));

    const err = await api.forum.createTopic("c1", "Title", TOKEN).catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(402);
  });

  it("F-11: auth yok → 401 ApiError", async () => {
    fetchMock.mockResolvedValueOnce(mockErr({ error: "Unauthorized" }, 401));

    await expect(api.forum.createTopic("c1", "Title", "")).rejects.toThrow(ApiError);
  });
});

// ── F-12/F-13/F-14: Yorum ekleme ─────────────────────────────────────────────
describe("POST /forum/topics/:id/comments", () => {
  it("F-12: başarılı yorum → id döner", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ id: "new-comment" }));

    const res = await api.forum.createComment("t1", "Güzel konu!", TOKEN);
    expect(res.id).toBe("new-comment");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.content).toBe("Güzel konu!");
  });

  it("F-14: yetersiz kredi → 402 ApiError", async () => {
    fetchMock.mockResolvedValueOnce(mockErr({ error: "Insufficient credits" }, 402));

    const err = await api.forum.createComment("t1", "yorum", TOKEN).catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(402);
  });
});

// ── F-16/F-17: Upvote toggle ─────────────────────────────────────────────────
describe("POST /forum/topics/:id/upvote", () => {
  it("F-16: upvote ekle → sayaç artar, hasVoted=true", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ upvotes: 6, hasVoted: true }));

    const res = await api.forum.upvoteTopic("t1", TOKEN);
    expect(res.upvotes).toBe(6);
    expect(res.hasVoted).toBe(true);
  });

  it("F-17: tekrar upvote → hasVoted=false (toggle)", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ upvotes: 5, hasVoted: false }));

    const res = await api.forum.upvoteTopic("t1", TOKEN);
    expect(res.hasVoted).toBe(false);
  });
});

// ── F-18/F-19/F-20: Arama ────────────────────────────────────────────────────
describe("GET /forum/search", () => {
  it("F-18: sonuçlu arama → eşleşen konular", async () => {
    const results = [{ id: "t1", title: "Blue Card", categoryName: "Vize", countryName: "Almanya", createdAt: "2026-01-01", commentCount: 2 }];
    fetchMock.mockResolvedValueOnce(mockOk(results));

    const res = await api.forum.search("Blue Card");
    expect(res).toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toContain("q=Blue+Card");
  });

  it("F-19: sonuçsuz arama → boş dizi", async () => {
    fetchMock.mockResolvedValueOnce(mockOk([]));

    const res = await api.forum.search("xyzabc123");
    expect(res).toHaveLength(0);
  });

  it("countryId parametresi varsa URL'e eklenir", async () => {
    fetchMock.mockResolvedValueOnce(mockOk([]));

    await api.forum.search("vize", "de");
    expect(fetchMock.mock.calls[0][0]).toContain("countryId=de");
  });

  it("getComments: yorumlar listelenir", async () => {
    const comments = [{ id: "c1", authorId: "u1", authorDisplayName: "Ali", content: "...", createdAt: "2026-01-01" }];
    fetchMock.mockResolvedValueOnce(mockOk(comments));

    const res = await api.forum.getComments("t1", TOKEN);
    expect(res[0].authorDisplayName).toBe("Ali");
  });
});


