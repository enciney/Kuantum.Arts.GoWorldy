/**
 * Component Handler Testleri — ProfileScreen
 *
 * React render gerektirmez. Profil ekranındaki iş mantığını test eder:
 * profil yükleme, üye türü değiştirme, bio kaydetme, avatar yükleme.
 */

import { ApiError } from "../../src/services/api";
import {
  loadProfileData,
  selectUserType,
  saveBio,
  uploadAvatar,
} from "../../src/screens/main/profileHandlers";

const MOCK_PROFILE = {
  id: "user-1",
  email: "ali@test.com",
  displayName: "Ali Yılmaz",
  bio: "Göç adayı, Almanya planlıyorum.",
  avatarUrl: "",
  role: "user",
  credits: 10,
  isPremium: false,
  userType: "emigrant" as const,
  phoneNumber: "",
  sharePhoneNumber: false,
};

const MOCK_STATS = {
  topicCount: 3,
  commentCount: 12,
  followingCount: 2,
  completedSteps: 5,
};

// ── loadProfileData() ─────────────────────────────────────────────────────────

describe("loadProfileData() — profil verisi yükleme", () => {
  it("PR-01: token varsa me ve myStats paralel çağrılır", async () => {
    const mockMe = jest.fn().mockResolvedValue(MOCK_PROFILE);
    const mockMyStats = jest.fn().mockResolvedValue(MOCK_STATS);
    await loadProfileData("tok123", { me: mockMe, myStats: mockMyStats } as any);
    expect(mockMe).toHaveBeenCalledWith("tok123");
    expect(mockMyStats).toHaveBeenCalledWith("tok123");
  });

  it("PR-02: dönen profil ve stats verisi eksiksiz iletilir", async () => {
    const mockMe = jest.fn().mockResolvedValue(MOCK_PROFILE);
    const mockMyStats = jest.fn().mockResolvedValue(MOCK_STATS);
    const result = await loadProfileData("tok123", { me: mockMe, myStats: mockMyStats } as any);
    expect(result.profile.displayName).toBe("Ali Yılmaz");
    expect(result.stats.topicCount).toBe(3);
    expect(result.stats.commentCount).toBe(12);
  });

  it("PR-03: token yoksa fırlatır — ekran login'e yönlendirir", async () => {
    const mockMe = jest.fn();
    const mockMyStats = jest.fn();
    await expect(
      loadProfileData("", { me: mockMe, myStats: mockMyStats } as any)
    ).rejects.toThrow("Token gerekli");
    expect(mockMe).not.toHaveBeenCalled();
  });

  it("PR-04: API hata verince fırlatır", async () => {
    const mockMe = jest.fn().mockRejectedValue(new ApiError("Yetkisiz", 401));
    const mockMyStats = jest.fn().mockResolvedValue(MOCK_STATS);
    await expect(
      loadProfileData("tok123", { me: mockMe, myStats: mockMyStats } as any)
    ).rejects.toBeInstanceOf(ApiError);
  });
});

// ── selectUserType() ──────────────────────────────────────────────────────────

describe("selectUserType() — üye türü seçimi", () => {
  it("PR-05: farklı type seçilince updateMe doğru parametre ile çağrılır", async () => {
    const mockUpdateMe = jest.fn().mockResolvedValue({});
    await selectUserType("consultant", "emigrant", "tok123", { updateMe: mockUpdateMe } as any);
    expect(mockUpdateMe).toHaveBeenCalledWith(
      expect.objectContaining({ userType: "consultant" }),
      "tok123"
    );
  });

  it("PR-06: mevcut type yeniden seçilince updateMe hiç çağrılmaz", async () => {
    const mockUpdateMe = jest.fn();
    await selectUserType("emigrant", "emigrant", "tok123", { updateMe: mockUpdateMe } as any);
    expect(mockUpdateMe).not.toHaveBeenCalled();
  });

  it("PR-07: token yoksa fırlatır — updateMe çağrılmaz", async () => {
    const mockUpdateMe = jest.fn();
    await expect(
      selectUserType("consultant", "emigrant", "", { updateMe: mockUpdateMe } as any)
    ).rejects.toThrow("Token gerekli");
    expect(mockUpdateMe).not.toHaveBeenCalled();
  });

  it("PR-08: API hata verince fırlatır — ekran önceki type'a geri döner", async () => {
    const mockUpdateMe = jest.fn().mockRejectedValue(new ApiError("Güncelleme başarısız", 400));
    await expect(
      selectUserType("diaspora", "emigrant", "tok123", { updateMe: mockUpdateMe } as any)
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("PR-09: tüm geçerli type değerleri kabul edilir", async () => {
    const mockUpdateMe = jest.fn().mockResolvedValue({});
    for (const type of ["emigrant", "consultant", "diaspora"] as const) {
      mockUpdateMe.mockClear();
      await selectUserType(type, "other", "tok123", { updateMe: mockUpdateMe } as any);
      expect(mockUpdateMe).toHaveBeenCalledWith(
        expect.objectContaining({ userType: type }),
        "tok123"
      );
    }
  });
});

// ── saveBio() ─────────────────────────────────────────────────────────────────

describe("saveBio() — biyografi kaydetme", () => {
  it("PR-10: bio metni updateMe'ye iletilir", async () => {
    const mockUpdateMe = jest.fn().mockResolvedValue({});
    await saveBio("Almanya'ya göç planlıyorum.", "tok123", { updateMe: mockUpdateMe } as any);
    expect(mockUpdateMe).toHaveBeenCalledWith(
      expect.objectContaining({ bio: "Almanya'ya göç planlıyorum." }),
      "tok123"
    );
  });

  it("PR-11: boş bio string'i de gönderilebilir (biyografi silme)", async () => {
    const mockUpdateMe = jest.fn().mockResolvedValue({});
    await saveBio("", "tok123", { updateMe: mockUpdateMe } as any);
    expect(mockUpdateMe).toHaveBeenCalledWith(
      expect.objectContaining({ bio: "" }),
      "tok123"
    );
  });

  it("PR-12: token yoksa fırlatır — updateMe çağrılmaz", async () => {
    const mockUpdateMe = jest.fn();
    await expect(
      saveBio("bio text", "", { updateMe: mockUpdateMe } as any)
    ).rejects.toThrow("Token gerekli");
    expect(mockUpdateMe).not.toHaveBeenCalled();
  });

  it("PR-13: API hata verince fırlatır", async () => {
    const mockUpdateMe = jest.fn().mockRejectedValue(new ApiError("Kayıt hatası", 500));
    await expect(
      saveBio("bio text", "tok123", { updateMe: mockUpdateMe } as any)
    ).rejects.toBeInstanceOf(ApiError);
  });
});

// ── uploadAvatar() ────────────────────────────────────────────────────────────

describe("uploadAvatar() — avatar yükleme", () => {
  it("PR-14: dataUrl updateMe'ye avatarUrl olarak iletilir", async () => {
    const mockUpdateMe = jest.fn().mockResolvedValue({});
    const dataUrl = "data:image/jpeg;base64,/9j/4AAQ...";
    await uploadAvatar(dataUrl, "tok123", { updateMe: mockUpdateMe } as any);
    expect(mockUpdateMe).toHaveBeenCalledWith(
      expect.objectContaining({ avatarUrl: dataUrl }),
      "tok123"
    );
  });

  it("PR-15: token yoksa fırlatır — updateMe çağrılmaz", async () => {
    const mockUpdateMe = jest.fn();
    await expect(
      uploadAvatar("data:image/jpeg;base64,abc", "", { updateMe: mockUpdateMe } as any)
    ).rejects.toThrow("Token gerekli");
    expect(mockUpdateMe).not.toHaveBeenCalled();
  });

  it("PR-16: dataUrl boşsa fırlatır — API'ya geçersiz veri gönderilmez", async () => {
    const mockUpdateMe = jest.fn();
    await expect(
      uploadAvatar("", "tok123", { updateMe: mockUpdateMe } as any)
    ).rejects.toThrow("Fotoğraf verisi gerekli");
    expect(mockUpdateMe).not.toHaveBeenCalled();
  });

  it("PR-17: API hata verince fırlatır — ekran alert gösterir", async () => {
    const mockUpdateMe = jest.fn().mockRejectedValue(new ApiError("Dosya çok büyük", 413));
    await expect(
      uploadAvatar("data:image/jpeg;base64,abc", "tok123", { updateMe: mockUpdateMe } as any)
    ).rejects.toBeInstanceOf(ApiError);
  });
});
