import { loadComments, postComment, upvoteTopic } from "../../src/screens/main/forumTopicDetailHandlers";

const mockComment = {
  id: "cm1",
  authorId: "u1",
  authorDisplayName: "Ali",
  content: "Güzel konu",
  createdAt: "2026-01-01",
};

describe("loadComments()", () => {
  it("FD-01: geçerli topicId ve token ile yorumlar döner", async () => {
    const mockGet = jest.fn().mockResolvedValue([mockComment]);
    const result = await loadComments("t1", "tok", { getComments: mockGet } as any);
    expect(mockGet).toHaveBeenCalledWith("t1", "tok");
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("Güzel konu");
  });

  it("FD-02: token yoksa boş dizi döner — API çağrılmaz", async () => {
    const mockGet = jest.fn();
    const result = await loadComments("t1", "", { getComments: mockGet } as any);
    expect(result).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("FD-03: API hatası fırlatılır", async () => {
    const mockGet = jest.fn().mockRejectedValue(new Error("Yorum yüklenemedi"));
    await expect(
      loadComments("t1", "tok", { getComments: mockGet } as any)
    ).rejects.toThrow("Yorum yüklenemedi");
  });

  it("FD-04: yorum yoksa boş dizi döner", async () => {
    const mockGet = jest.fn().mockResolvedValue([]);
    const result = await loadComments("t1", "tok", { getComments: mockGet } as any);
    expect(result).toEqual([]);
  });
});

describe("postComment()", () => {
  it("FD-05: geçerli içerikle yorum oluşturulur ve id döner", async () => {
    const mockCreate = jest.fn().mockResolvedValue({ id: "cm2" });
    const result = await postComment("t1", "Teşekkürler!", "tok", { createComment: mockCreate } as any);
    expect(mockCreate).toHaveBeenCalledWith("t1", "Teşekkürler!", "tok");
    expect(result.id).toBe("cm2");
  });

  it("FD-06: içerik trim edilir", async () => {
    const mockCreate = jest.fn().mockResolvedValue({ id: "cm3" });
    await postComment("t1", "  Merhaba  ", "tok", { createComment: mockCreate } as any);
    expect(mockCreate).toHaveBeenCalledWith("t1", "Merhaba", "tok");
  });

  it("FD-07: token yoksa fırlatır — API çağrılmaz", async () => {
    const mockCreate = jest.fn();
    await expect(
      postComment("t1", "İçerik", "", { createComment: mockCreate } as any)
    ).rejects.toThrow("Token gerekli");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("FD-08: boş içerik fırlatır — API çağrılmaz", async () => {
    const mockCreate = jest.fn();
    await expect(
      postComment("t1", "", "tok", { createComment: mockCreate } as any)
    ).rejects.toThrow("Yorum boş olamaz");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("FD-09: sadece boşluktan oluşan içerik fırlatır", async () => {
    const mockCreate = jest.fn();
    await expect(
      postComment("t1", "   ", "tok", { createComment: mockCreate } as any)
    ).rejects.toThrow("Yorum boş olamaz");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("FD-10: API hatası fırlatılır", async () => {
    const mockCreate = jest.fn().mockRejectedValue(new Error("Yorum gönderilemedi"));
    await expect(
      postComment("t1", "İçerik", "tok", { createComment: mockCreate } as any)
    ).rejects.toThrow("Yorum gönderilemedi");
  });
});

describe("upvoteTopic()", () => {
  it("FD-11: geçerli topicId ile upvote çağrılır", async () => {
    const mockUpvote = jest.fn().mockResolvedValue({ upvotes: 10, hasVoted: true });
    const result = await upvoteTopic("t1", "tok", { upvoteTopic: mockUpvote } as any);
    expect(mockUpvote).toHaveBeenCalledWith("t1", "tok");
    expect(result.upvotes).toBe(10);
    expect(result.hasVoted).toBe(true);
  });

  it("FD-12: token yoksa fırlatır — API çağrılmaz", async () => {
    const mockUpvote = jest.fn();
    await expect(
      upvoteTopic("t1", "", { upvoteTopic: mockUpvote } as any)
    ).rejects.toThrow("Token gerekli");
    expect(mockUpvote).not.toHaveBeenCalled();
  });

  it("FD-13: API hatası fırlatılır", async () => {
    const mockUpvote = jest.fn().mockRejectedValue(new Error("Upvote başarısız"));
    await expect(
      upvoteTopic("t1", "tok", { upvoteTopic: mockUpvote } as any)
    ).rejects.toThrow("Upvote başarısız");
  });
});
