import { loadTopics, upvoteTopicInList } from "../../src/screens/main/forumTopicsHandlers";

const makeTopic = (overrides = {}) => ({
  id: "t1",
  title: "Test Konusu",
  authorId: "u1",
  isPinned: false,
  status: "open",
  createdAt: "2026-01-01",
  commentCount: 3,
  upvotes: 5,
  hasUpvoted: false,
  ...overrides,
});

describe("loadTopics()", () => {
  it("FT-01: geçerli parametrelerle konular döner", async () => {
    const mockGet = jest.fn().mockResolvedValue({
      data: [makeTopic()],
      page: 1,
      totalPages: 1,
      total: 1,
    });
    const result = await loadTopics("cat1", "tok", 1, 20, { getTopics: mockGet } as any);
    expect(mockGet).toHaveBeenCalledWith("cat1", "tok", 1, 20);
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("FT-02: token yoksa boş sonuç döner — API çağrılmaz", async () => {
    const mockGet = jest.fn();
    const result = await loadTopics("cat1", "", 1, 20, { getTopics: mockGet } as any);
    expect(result).toEqual({ data: [], page: 1, totalPages: 1, total: 0 });
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("FT-03: undefined upvotes → 0'a normalize edilir", async () => {
    const mockGet = jest.fn().mockResolvedValue({
      data: [makeTopic({ upvotes: undefined })],
      page: 1,
      totalPages: 1,
      total: 1,
    });
    const result = await loadTopics("cat1", "tok", 1, 20, { getTopics: mockGet } as any);
    expect(result.data[0].upvotes).toBe(0);
  });

  it("FT-04: undefined hasUpvoted → false'a normalize edilir", async () => {
    const mockGet = jest.fn().mockResolvedValue({
      data: [makeTopic({ hasUpvoted: undefined })],
      page: 1,
      totalPages: 1,
      total: 1,
    });
    const result = await loadTopics("cat1", "tok", 1, 20, { getTopics: mockGet } as any);
    expect(result.data[0].hasUpvoted).toBe(false);
  });

  it("FT-05: sayfalama — page 2 iletilir", async () => {
    const mockGet = jest.fn().mockResolvedValue({ data: [], page: 2, totalPages: 5, total: 100 });
    const result = await loadTopics("cat1", "tok", 2, 20, { getTopics: mockGet } as any);
    expect(mockGet).toHaveBeenCalledWith("cat1", "tok", 2, 20);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(5);
  });

  it("FT-06: API hatası fırlatılır", async () => {
    const mockGet = jest.fn().mockRejectedValue(new Error("Zaman aşımı"));
    await expect(
      loadTopics("cat1", "tok", 1, 20, { getTopics: mockGet } as any)
    ).rejects.toThrow("Zaman aşımı");
  });
});

describe("upvoteTopicInList()", () => {
  it("FT-07: geçerli topicId ile upvote çağrılır ve sonuç iletilir", async () => {
    const mockUpvote = jest.fn().mockResolvedValue({ upvotes: 6, hasVoted: true });
    const result = await upvoteTopicInList("t1", "tok", { upvoteTopic: mockUpvote } as any);
    expect(mockUpvote).toHaveBeenCalledWith("t1", "tok");
    expect(result.upvotes).toBe(6);
    expect(result.hasVoted).toBe(true);
  });

  it("FT-08: token yoksa fırlatır — API çağrılmaz", async () => {
    const mockUpvote = jest.fn();
    await expect(
      upvoteTopicInList("t1", "", { upvoteTopic: mockUpvote } as any)
    ).rejects.toThrow("Token gerekli");
    expect(mockUpvote).not.toHaveBeenCalled();
  });

  it("FT-09: API hatası fırlatılır", async () => {
    const mockUpvote = jest.fn().mockRejectedValue(new Error("Upvote başarısız"));
    await expect(
      upvoteTopicInList("t1", "tok", { upvoteTopic: mockUpvote } as any)
    ).rejects.toThrow("Upvote başarısız");
  });
});
