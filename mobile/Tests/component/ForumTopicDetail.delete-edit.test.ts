/**
 * Component Handler Testleri — FRM-CMT-004, FRM-TPC-005, FRM-TPC-006
 *
 * Yorum silme (Modal confirm), konu düzenleme talebi, konu silme talebi
 * handler'larını React render gerektirmeden test eder.
 */

import { ApiError } from "../../src/services/api";
import {
  deleteComment,
  submitTopicDeletionRequest,
  submitTopicEditRequest,
} from "../../src/screens/main/forumTopicDetailHandlers";

const TOKEN = "test-tok";
const TOPIC_ID = "topic-1";
const COMMENT_ID = "comment-1";

// ── deleteComment() — FRM-CMT-004 ────────────────────────────────────────────

describe("deleteComment() — yorum silme (FRM-CMT-004)", () => {
  it("DC-01: geçerli token ve id ile deleteComment çağrılır", async () => {
    const mockDel = jest.fn().mockResolvedValue({ ok: true });
    await deleteComment(TOPIC_ID, COMMENT_ID, TOKEN, { deleteComment: mockDel } as any);
    expect(mockDel).toHaveBeenCalledWith(TOPIC_ID, COMMENT_ID, TOKEN);
  });

  it("DC-02: token yoksa API çağrılmaz ve fırlatır", async () => {
    const mockDel = jest.fn();
    await expect(
      deleteComment(TOPIC_ID, COMMENT_ID, "", { deleteComment: mockDel } as any)
    ).rejects.toThrow("Token gerekli");
    expect(mockDel).not.toHaveBeenCalled();
  });

  it("DC-03: 403 (silme penceresi geçti) — ApiError olarak fırlatır", async () => {
    const mockDel = jest.fn().mockRejectedValue(new ApiError("Silme süresi doldu", 403));
    await expect(
      deleteComment(TOPIC_ID, COMMENT_ID, TOKEN, { deleteComment: mockDel } as any)
    ).rejects.toBeInstanceOf(ApiError);
    const err = await deleteComment(TOPIC_ID, COMMENT_ID, TOKEN, { deleteComment: mockDel } as any)
      .catch((e) => e);
    expect(err.status).toBe(403);
  });

  it("DC-04: 404 (yorum bulunamadı) — ApiError olarak fırlatır", async () => {
    const mockDel = jest.fn().mockRejectedValue(new ApiError("Yorum bulunamadı", 404));
    const err = await deleteComment(TOPIC_ID, COMMENT_ID, TOKEN, { deleteComment: mockDel } as any)
      .catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
  });
});

// ── submitTopicDeletionRequest() — FRM-TPC-006 ───────────────────────────────

describe("submitTopicDeletionRequest() — konu silme talebi (FRM-TPC-006)", () => {
  it("DR-01: geçerli sebep ile API çağrılır ve shouldClose=true döner", async () => {
    const mockReq = jest.fn().mockResolvedValue({ id: "req-1", status: "pending" });
    const result = await submitTopicDeletionRequest(TOPIC_ID, "Spam içerik var burada", TOKEN, {
      requestTopicDeletion: mockReq,
    } as any);
    expect(mockReq).toHaveBeenCalledWith(TOPIC_ID, "Spam içerik var burada", TOKEN);
    expect(result.shouldClose).toBe(true);
    expect(result.duplicate).toBe(false);
  });

  it("DR-02: sebep trim edilir", async () => {
    const mockReq = jest.fn().mockResolvedValue({ id: "req-2", status: "pending" });
    await submitTopicDeletionRequest(TOPIC_ID, "  Gereksiz içerik  ", TOKEN, {
      requestTopicDeletion: mockReq,
    } as any);
    expect(mockReq).toHaveBeenCalledWith(TOPIC_ID, "Gereksiz içerik", TOKEN);
  });

  it("DR-03: sebep < 5 karakter → fırlatır, API çağrılmaz", async () => {
    const mockReq = jest.fn();
    await expect(
      submitTopicDeletionRequest(TOPIC_ID, "kısa", TOKEN, { requestTopicDeletion: mockReq } as any)
    ).rejects.toThrow("Silme sebebi en az 5 karakter olmalı.");
    expect(mockReq).not.toHaveBeenCalled();
  });

  it("DR-04: boş sebep → fırlatır", async () => {
    const mockReq = jest.fn();
    await expect(
      submitTopicDeletionRequest(TOPIC_ID, "", TOKEN, { requestTopicDeletion: mockReq } as any)
    ).rejects.toThrow();
    expect(mockReq).not.toHaveBeenCalled();
  });

  it("DR-05: token yoksa fırlatır, API çağrılmaz", async () => {
    const mockReq = jest.fn();
    await expect(
      submitTopicDeletionRequest(TOPIC_ID, "Geçerli bir sebep", "", { requestTopicDeletion: mockReq } as any)
    ).rejects.toThrow("Token gerekli");
    expect(mockReq).not.toHaveBeenCalled();
  });

  it("DR-06: 409 Conflict → shouldClose=true, duplicate=true (modal kapanır, hata fırlatmaz)", async () => {
    const mockReq = jest.fn().mockRejectedValue(new ApiError("Zaten talep var", 409));
    const result = await submitTopicDeletionRequest(TOPIC_ID, "Geçerli bir sebep", TOKEN, {
      requestTopicDeletion: mockReq,
    } as any);
    expect(result.shouldClose).toBe(true);
    expect(result.duplicate).toBe(true);
  });

  it("DR-07: 500 server error → fırlatır (modal kapanmaz)", async () => {
    const mockReq = jest.fn().mockRejectedValue(new ApiError("Sunucu hatası", 500));
    await expect(
      submitTopicDeletionRequest(TOPIC_ID, "Geçerli bir sebep", TOKEN, {
        requestTopicDeletion: mockReq,
      } as any)
    ).rejects.toBeInstanceOf(ApiError);
  });
});

// ── submitTopicEditRequest() — FRM-TPC-005 ───────────────────────────────────

describe("submitTopicEditRequest() — konu düzenleme talebi (FRM-TPC-005)", () => {
  it("ER-01: geçerli başlık ile requestTopicEdit çağrılır ve id döner", async () => {
    const mockReq = jest.fn().mockResolvedValue({ id: "edit-1", status: "pending" });
    const result = await submitTopicEditRequest(
      TOPIC_ID,
      "Bu düzenleme talebi başlığıdır",
      "Yeni içerik",
      TOKEN,
      { requestTopicEdit: mockReq } as any
    );
    expect(mockReq).toHaveBeenCalledWith(TOPIC_ID, {
      title: "Bu düzenleme talebi başlığıdır",
      content: "Yeni içerik",
    }, TOKEN);
    expect(result.id).toBe("edit-1");
    expect(result.status).toBe("pending");
  });

  it("ER-02: başlık trim edilir", async () => {
    const mockReq = jest.fn().mockResolvedValue({ id: "edit-2", status: "pending" });
    await submitTopicEditRequest(TOPIC_ID, "  Düzeltilmiş başlık buraya  ", undefined, TOKEN, {
      requestTopicEdit: mockReq,
    } as any);
    expect(mockReq).toHaveBeenCalledWith(TOPIC_ID, {
      title: "Düzeltilmiş başlık buraya",
      content: undefined,
    }, TOKEN);
  });

  it("ER-03: başlık < 10 karakter → fırlatır, API çağrılmaz", async () => {
    const mockReq = jest.fn();
    await expect(
      submitTopicEditRequest(TOPIC_ID, "Kısa", undefined, TOKEN, { requestTopicEdit: mockReq } as any)
    ).rejects.toThrow("Başlık en az 10 karakter olmalı.");
    expect(mockReq).not.toHaveBeenCalled();
  });

  it("ER-04: token yoksa fırlatır, API çağrılmaz", async () => {
    const mockReq = jest.fn();
    await expect(
      submitTopicEditRequest(TOPIC_ID, "Geçerli uzun bir başlık", undefined, "", {
        requestTopicEdit: mockReq,
      } as any)
    ).rejects.toThrow("Token gerekli");
    expect(mockReq).not.toHaveBeenCalled();
  });

  it("ER-05: content undefined ise API'ya undefined gönderilir", async () => {
    const mockReq = jest.fn().mockResolvedValue({ id: "edit-3", status: "pending" });
    await submitTopicEditRequest(TOPIC_ID, "Başlık değişikliği yapıyorum", undefined, TOKEN, {
      requestTopicEdit: mockReq,
    } as any);
    const call = mockReq.mock.calls[0][1];
    expect(call.content).toBeUndefined();
  });
});
