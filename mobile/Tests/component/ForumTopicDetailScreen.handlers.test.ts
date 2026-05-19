import {
  loadComments,
  postComment,
  upvoteTopic,
  buildTopicMenuOptions,
  buildCommentMenuOptions,
  dispatchTopicMenuSelect,
  dispatchCommentMenuSelect,
  getVisibleReplies,
  getReplyToggleLabel,
  buildShareContent,
} from "../../src/screens/main/forumTopicDetailHandlers";

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

// FRM-TPC-005 + FRM-TPC-006 regression: konu başlığı 3-nokta menüsünün
// opsiyonları her kullanıcı rolü için doğru derlenmeli.
describe("buildTopicMenuOptions()", () => {
  it("FD-14: 24h içinde owner için Düzenle + Silme talebi + İptal döner", () => {
    const opts = buildTopicMenuOptions({
      isOwner: true,
      canEditTopic: true,
      canStaffEdit: false,
      loggedIn: true,
    });
    const actions = opts.map((o) => o.action);
    expect(actions).toEqual(["edit", "delete", "cancel"]);
    const texts = opts.map((o) => o.text);
    expect(texts).toContain("Konuyu düzenle");
    expect(texts).toContain("Silme talebi gönder");
    expect(opts.find((o) => o.action === "delete")?.style).toBe("destructive");
  });

  it("FD-15: 24h sonrası owner için yalnız Silme talebi + İptal döner (düzenleme yok)", () => {
    const opts = buildTopicMenuOptions({
      isOwner: true,
      canEditTopic: false,
      canStaffEdit: false,
      loggedIn: true,
    });
    expect(opts.map((o) => o.action)).toEqual(["delete", "cancel"]);
  });

  it("FD-16: non-owner login için Raporla + İptal döner (Düzenle/Sil yok)", () => {
    const opts = buildTopicMenuOptions({
      isOwner: false,
      canEditTopic: false,
      canStaffEdit: false,
      loggedIn: true,
    });
    const actions = opts.map((o) => o.action);
    expect(actions).toEqual(["report", "cancel"]);
    expect(actions).not.toContain("edit");
    expect(actions).not.toContain("delete");
  });

  it("FD-17: staff (non-owner) için Düzenle + Raporla + İptal döner — silme talebi yok", () => {
    const opts = buildTopicMenuOptions({
      isOwner: false,
      canEditTopic: false,
      canStaffEdit: true,
      loggedIn: true,
    });
    const actions = opts.map((o) => o.action);
    expect(actions).toEqual(["edit", "report", "cancel"]);
  });

  it("FD-18: anonim (logged-out) kullanıcı için yalnız İptal döner", () => {
    const opts = buildTopicMenuOptions({
      isOwner: false,
      canEditTopic: false,
      canStaffEdit: false,
      loggedIn: false,
    });
    expect(opts.map((o) => o.action)).toEqual(["cancel"]);
  });

  it("FD-19: menü en az 'İptal' aksiyonunu daima içerir", () => {
    const opts = buildTopicMenuOptions({
      isOwner: false,
      canEditTopic: false,
      canStaffEdit: false,
      loggedIn: false,
    });
    const cancel = opts.find((o) => o.action === "cancel");
    expect(cancel).toBeDefined();
    expect(cancel?.style).toBe("cancel");
  });
});

// FRM-CMT-003 + FRM-CMT-004 regression: yorum 3-nokta menüsünün opsiyonları
// her kullanıcı rolü için doğru derlenmeli. Pressable + Alert.alert sıkıntısı
// component'ta giderildi; pure fn yalnız option list'i doğrular.
describe("buildCommentMenuOptions()", () => {
  it("FC-01: owner + 15dk içi → Düzenle + Sil + İptal", () => {
    const opts = buildCommentMenuOptions({
      isOwner: true,
      isStaff: false,
      loggedIn: true,
      isDeleted: false,
      canEditComment: true,
    });
    const actions = opts.map((o) => o.action);
    expect(actions).toEqual(["edit", "delete", "cancel"]);
    expect(opts.find((o) => o.action === "delete")?.style).toBe("destructive");
    expect(actions).not.toContain("report");
  });

  it("FC-02: owner + 15dk sonrası → yalnız Sil + İptal (Düzenle yok)", () => {
    const opts = buildCommentMenuOptions({
      isOwner: true,
      isStaff: false,
      loggedIn: true,
      isDeleted: false,
      canEditComment: false,
    });
    expect(opts.map((o) => o.action)).toEqual(["delete", "cancel"]);
  });

  it("FC-03: non-owner login → Raporla + İptal (Düzenle/Sil yok)", () => {
    const opts = buildCommentMenuOptions({
      isOwner: false,
      isStaff: false,
      loggedIn: true,
      isDeleted: false,
      canEditComment: false,
    });
    expect(opts.map((o) => o.action)).toEqual(["report", "cancel"]);
  });

  it("FC-04: staff (non-owner) → Düzenle + Sil + Raporla + İptal", () => {
    const opts = buildCommentMenuOptions({
      isOwner: false,
      isStaff: true,
      loggedIn: true,
      isDeleted: false,
      canEditComment: true,
    });
    const actions = opts.map((o) => o.action);
    expect(actions).toEqual(["edit", "delete", "report", "cancel"]);
    expect(opts.find((o) => o.action === "delete")?.style).toBe("destructive");
  });

  it("FC-05: anonim (logged-out) → menü hiç açılmaz (boş dizi)", () => {
    const opts = buildCommentMenuOptions({
      isOwner: false,
      isStaff: false,
      loggedIn: false,
      isDeleted: false,
      canEditComment: false,
    });
    expect(opts).toEqual([]);
  });

  it("FC-06: silinmiş yorum → menü hiç açılmaz (owner olsa bile)", () => {
    const opts = buildCommentMenuOptions({
      isOwner: true,
      isStaff: false,
      loggedIn: true,
      isDeleted: true,
      canEditComment: true,
    });
    expect(opts).toEqual([]);
  });

  it("FC-07: silinmiş yorum + staff → menü yine açılmaz", () => {
    const opts = buildCommentMenuOptions({
      isOwner: false,
      isStaff: true,
      loggedIn: true,
      isDeleted: true,
      canEditComment: true,
    });
    expect(opts).toEqual([]);
  });

  it("FC-08: menü açıldığında 'İptal' her zaman cancel style ile son sırada", () => {
    const opts = buildCommentMenuOptions({
      isOwner: false,
      isStaff: false,
      loggedIn: true,
      isDeleted: false,
      canEditComment: false,
    });
    const last = opts[opts.length - 1];
    expect(last.action).toBe("cancel");
    expect(last.style).toBe("cancel");
  });
});

describe("getVisibleReplies / getReplyToggleLabel", () => {
  const mk = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `r${i + 1}` }));

  it("RC-01: 0 reply → visible=[], label=null", () => {
    const replies = mk(0);
    expect(getVisibleReplies(replies, "partial")).toEqual([]);
    expect(getReplyToggleLabel(replies, "partial")).toBeNull();
  });

  it("RC-02: 1 reply, partial → visible=[1], label='Yanıtları gizle' (her zaman görünür)", () => {
    const replies = mk(1);
    expect(getVisibleReplies(replies, "partial")).toEqual(replies);
    expect(getReplyToggleLabel(replies, "partial")).toEqual({
      label: "Yanıtları gizle",
      nextState: "collapsed",
    });
  });

  it("RC-03: 2 reply, partial → visible=[1,2], label='Yanıtları gizle' (tam limit)", () => {
    const replies = mk(2);
    expect(getVisibleReplies(replies, "partial")).toEqual(replies);
    expect(getReplyToggleLabel(replies, "partial")).toEqual({
      label: "Yanıtları gizle",
      nextState: "collapsed",
    });
  });

  it("RC-N: 1 reply, partial → toggle her zaman görünür (FRM-CMT-006 regression)", () => {
    const replies = mk(1);
    const info = getReplyToggleLabel(replies, "partial");
    expect(info).not.toBeNull();
    expect(info?.label).toBe("Yanıtları gizle");
    expect(info?.nextState).toBe("collapsed");
  });

  it("RC-04: 3 reply, partial → visible=[1,2], label='1 yanıtı daha göster' → expanded", () => {
    const replies = mk(3);
    expect(getVisibleReplies(replies, "partial")).toEqual(replies.slice(0, 2));
    expect(getReplyToggleLabel(replies, "partial")).toEqual({
      label: "1 yanıtı daha göster",
      nextState: "expanded",
    });
  });

  it("RC-05: 5 reply, partial → visible=[1,2], label='3 yanıtı daha göster' → expanded", () => {
    const replies = mk(5);
    expect(getVisibleReplies(replies, "partial")).toEqual(replies.slice(0, 2));
    expect(getReplyToggleLabel(replies, "partial")).toEqual({
      label: "3 yanıtı daha göster",
      nextState: "expanded",
    });
  });

  it("RC-06: 5 reply, expanded → visible=hepsi, label='Yanıtları gizle' → collapsed", () => {
    const replies = mk(5);
    expect(getVisibleReplies(replies, "expanded")).toEqual(replies);
    expect(getReplyToggleLabel(replies, "expanded")).toEqual({
      label: "Yanıtları gizle",
      nextState: "collapsed",
    });
  });

  it("RC-07: 5 reply, collapsed → visible=[], label='5 yanıtı göster' → expanded", () => {
    const replies = mk(5);
    expect(getVisibleReplies(replies, "collapsed")).toEqual([]);
    expect(getReplyToggleLabel(replies, "collapsed")).toEqual({
      label: "5 yanıtı göster",
      nextState: "expanded",
    });
  });

  it("RC-08: 2 reply, expanded → 'Yanıtları gizle' butonu yine de render edilir (state expanded)", () => {
    const replies = mk(2);
    expect(getVisibleReplies(replies, "expanded")).toEqual(replies);
    expect(getReplyToggleLabel(replies, "expanded")).toEqual({
      label: "Yanıtları gizle",
      nextState: "collapsed",
    });
  });
});

describe("buildShareContent()", () => {
  const WEB = "https://test.example.com";

  it("SH-01: normal topic → title, deep link ve config web URL mesajda geçer", () => {
    const c = buildShareContent(
      { id: "abc123", title: "İstanbul Gezi Notları" },
      { web: WEB }
    );
    expect(c.title).toBe("İstanbul Gezi Notları");
    expect(c.url).toBe(`${WEB}/topic/abc123`);
    expect(c.message).toContain("İstanbul Gezi Notları");
    expect(c.message).toContain("goworldy://topic/abc123");
  });

  it("SH-02: title boş → mesaj yine geçerli string ve deep link içerir", () => {
    const c = buildShareContent({ id: "t1", title: "" }, { web: WEB });
    expect(typeof c.message).toBe("string");
    expect(c.message.length).toBeGreaterThan(0);
    expect(c.message).toContain("goworldy://topic/t1");
    expect(c.url).toBe(`${WEB}/topic/t1`);
    expect(c.title).toBe("");
  });

  it("SH-03: id UUID (özel karakter '-') → URL'lerde doğru geçer", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const c = buildShareContent({ id: uuid, title: "Test" }, { web: WEB });
    expect(c.url).toBe(`${WEB}/topic/${uuid}`);
    expect(c.message).toContain(`goworldy://topic/${uuid}`);
  });

  it("SH-04: title 250 char (uzun) → kırpılmaz, tam geçer", () => {
    const longTitle = "a".repeat(250);
    const c = buildShareContent({ id: "t1", title: longTitle }, { web: WEB });
    expect(c.title).toBe(longTitle);
    expect(c.title.length).toBe(250);
    expect(c.message).toContain(longTitle);
  });

  it("SH-N: trailing slash'lı web base URL → double slash olmamalı", () => {
    const c = buildShareContent(
      { id: "t1", title: "x" },
      { web: "https://example.com/" }
    );
    expect(c.url).toBe("https://example.com/topic/t1");
    expect(c.url).not.toContain("//topic");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FRM-TPC-005/006 + FRM-CMT-003/004 — Action menu dispatcher tests
//
// Önceki agent'in pure-fn fix'i (`buildTopicMenuOptions`/`buildCommentMenuOptions`)
// runtime'da çalışmadı: Alert.alert Android'de 3'ten fazla butonla sessizce
// drop ediyordu. Çözüm: Alert.alert yerine self-contained ActionMenuModal +
// pure `dispatchTopicMenuSelect`/`dispatchCommentMenuSelect`. Bu testler
// id → callback eşlemesinin doğruluğunu garanti eder; modal artık seçilen id'yi
// hangi callback'in tetikleyeceği bu fonksiyonlarla belirlenir.
// ─────────────────────────────────────────────────────────────────────────────

describe("dispatchTopicMenuSelect()", () => {
  function makeCb() {
    return { onEdit: jest.fn(), onDelete: jest.fn(), onReport: jest.fn() };
  }

  it("DT-01: 'edit' → onEdit çağrılır, diğerleri çağrılmaz", () => {
    const cb = makeCb();
    dispatchTopicMenuSelect("edit", cb);
    expect(cb.onEdit).toHaveBeenCalledTimes(1);
    expect(cb.onDelete).not.toHaveBeenCalled();
    expect(cb.onReport).not.toHaveBeenCalled();
  });

  it("DT-02: 'delete' → onDelete çağrılır", () => {
    const cb = makeCb();
    dispatchTopicMenuSelect("delete", cb);
    expect(cb.onDelete).toHaveBeenCalledTimes(1);
    expect(cb.onEdit).not.toHaveBeenCalled();
    expect(cb.onReport).not.toHaveBeenCalled();
  });

  it("DT-03: 'report' → onReport çağrılır", () => {
    const cb = makeCb();
    dispatchTopicMenuSelect("report", cb);
    expect(cb.onReport).toHaveBeenCalledTimes(1);
  });

  it("DT-04: 'cancel' → hiçbir callback çağrılmaz", () => {
    const cb = makeCb();
    dispatchTopicMenuSelect("cancel", cb);
    expect(cb.onEdit).not.toHaveBeenCalled();
    expect(cb.onDelete).not.toHaveBeenCalled();
    expect(cb.onReport).not.toHaveBeenCalled();
  });

  it("DT-05: bilinmeyen action → hiçbir callback çağrılmaz (sessiz no-op)", () => {
    const cb = makeCb();
    dispatchTopicMenuSelect("foo-bar", cb);
    expect(cb.onEdit).not.toHaveBeenCalled();
    expect(cb.onDelete).not.toHaveBeenCalled();
    expect(cb.onReport).not.toHaveBeenCalled();
  });
});

describe("dispatchCommentMenuSelect()", () => {
  function makeCb() {
    return { onEdit: jest.fn(), onDelete: jest.fn(), onReport: jest.fn() };
  }

  it("DC-01: 'edit' → onEdit çağrılır", () => {
    const cb = makeCb();
    dispatchCommentMenuSelect("edit", cb);
    expect(cb.onEdit).toHaveBeenCalledTimes(1);
    expect(cb.onDelete).not.toHaveBeenCalled();
    expect(cb.onReport).not.toHaveBeenCalled();
  });

  it("DC-02: 'delete' → onDelete çağrılır", () => {
    const cb = makeCb();
    dispatchCommentMenuSelect("delete", cb);
    expect(cb.onDelete).toHaveBeenCalledTimes(1);
  });

  it("DC-03: 'report' → onReport çağrılır", () => {
    const cb = makeCb();
    dispatchCommentMenuSelect("report", cb);
    expect(cb.onReport).toHaveBeenCalledTimes(1);
  });

  it("DC-04: 'cancel' → hiçbir callback çağrılmaz", () => {
    const cb = makeCb();
    dispatchCommentMenuSelect("cancel", cb);
    expect(cb.onEdit).not.toHaveBeenCalled();
    expect(cb.onDelete).not.toHaveBeenCalled();
    expect(cb.onReport).not.toHaveBeenCalled();
  });
});

describe("buildTopicMenuOptions × dispatchTopicMenuSelect entegrasyonu", () => {
  // Bu testler, menünün id'leriyle dispatch fonksiyonunun aynı action
  // anahtarlarını paylaştığını ve menüden seçilen her item'ın gerçekten
  // doğru callback'i tetiklediğini doğrular. (Alert.alert sessiz-drop bug'ının
  // tekrarlamayacağının garantisi.)
  it("DI-01: staff için tüm seçenekler (cancel hariç) dispatch ile uyumlu", () => {
    const cb = { onEdit: jest.fn(), onDelete: jest.fn(), onReport: jest.fn() };
    const opts = buildTopicMenuOptions({
      isOwner: false,
      canEditTopic: false,
      canStaffEdit: true,
      loggedIn: true,
    });
    // edit + report + cancel beklenir (owner değil → delete yok)
    const ids = opts.map((o) => o.action);
    expect(ids).toContain("edit");
    expect(ids).toContain("report");
    expect(ids).toContain("cancel");
    // Cancel hariç her id, ilgili callback'i tetiklemeli
    for (const a of ids) {
      if (a === "cancel") continue;
      dispatchTopicMenuSelect(a, cb);
    }
    expect(cb.onEdit).toHaveBeenCalledTimes(1);
    expect(cb.onReport).toHaveBeenCalledTimes(1);
    expect(cb.onDelete).not.toHaveBeenCalled();
  });

  it("DI-02: owner (edit penceresi içinde) → edit + delete tetiklenir, report tetiklenmez", () => {
    const cb = { onEdit: jest.fn(), onDelete: jest.fn(), onReport: jest.fn() };
    const opts = buildTopicMenuOptions({
      isOwner: true,
      canEditTopic: true,
      canStaffEdit: false,
      loggedIn: true,
    });
    for (const o of opts) {
      if (o.action === "cancel") continue;
      dispatchTopicMenuSelect(o.action, cb);
    }
    expect(cb.onEdit).toHaveBeenCalledTimes(1);
    expect(cb.onDelete).toHaveBeenCalledTimes(1);
    expect(cb.onReport).not.toHaveBeenCalled();
  });
});
