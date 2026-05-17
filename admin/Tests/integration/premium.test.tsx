/**
 * Premium (Plan Yönetimi + Kullanıcı Premium) integration tests
 *
 * Gerçek api.ts fetch zinciri + MSW kullanılır.
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./setup";
import { AuthProvider } from "../../src/AuthContext";
import PremiumPage from "../../src/pages/PremiumPage";
import { premiumPlans, premiumUser, regularUser, adminUser } from "./handlers";

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderPremium() {
  localStorage.setItem("admin_token", "fake-jwt-token");
  localStorage.setItem("admin_user", JSON.stringify(adminUser));
  return render(
    <MemoryRouter>
      <AuthProvider>
        <PremiumPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Premium Integration — Plan Yönetimi", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("planları API'dan yükler ve listeler", async () => {
    renderPremium();

    expect(await screen.findByText("Aylık Premium")).toBeInTheDocument();
    expect(screen.getByText("99 TL")).toBeInTheDocument();
    expect(screen.getByText("30 gün")).toBeInTheDocument();
    expect(screen.getByText("Sınırsız forum")).toBeInTheDocument();

    expect(screen.getByText("Haftalık Premium")).toBeInTheDocument();
    expect(screen.getByText("29 TL")).toBeInTheDocument();
    expect(screen.getByText("2 plan")).toBeInTheDocument();
  });

  it("aktif / pasif badge'leri doğru gösterilir", async () => {
    renderPremium();

    await screen.findByText("Aylık Premium");
    expect(screen.getByText("Aktif")).toBeInTheDocument();
    expect(screen.getByText("Pasif")).toBeInTheDocument();
  });

  it("yeni plan oluşturulur ve liste güncellenir", async () => {
    let createdBody: unknown;
    const newPlan = {
      id: "plan-new",
      name: "Yıllık Premium",
      description: "365 günlük",
      price: 499,
      durationDays: 365,
      features: ["Tüm özellikler"],
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    server.use(
      http.post("http://localhost:3000/api/admin/premium/plans", async ({ request }) => {
        createdBody = await request.json();
        return HttpResponse.json(newPlan, { status: 201 });
      }),
      http.get("http://localhost:3000/api/admin/premium/plans", () =>
        HttpResponse.json([...premiumPlans, newPlan])
      )
    );

    renderPremium();
    await screen.findByText("Aylık Premium");

    fireEvent.click(screen.getByRole("button", { name: "+ Yeni Plan" }));

    const textInputs = screen.getAllByRole("textbox");
    fireEvent.change(textInputs[0], { target: { value: "Yıllık Premium" } });
    fireEvent.change(textInputs[1], { target: { value: "365 günlük" } });

    const numberInputs = screen.getAllByRole("spinbutton");
    fireEvent.change(numberInputs[0], { target: { value: "499" } });
    fireEvent.change(numberInputs[1], { target: { value: "365" } });

    fireEvent.click(screen.getByRole("button", { name: "Oluştur" }));

    await waitFor(() => {
      expect(createdBody).toMatchObject({
        name: "Yıllık Premium",
        price: 499,
        durationDays: 365,
      });
      expect(screen.getByText("Yıllık Premium")).toBeInTheDocument();
      expect(screen.getByText("3 plan")).toBeInTheDocument();
    });
  });

  it("zorunlu alanlar boşken alert gösterilir, API çağrısı yapılmaz", async () => {
    const postSpy = vi.fn().mockReturnValue(HttpResponse.json({}));
    server.use(http.post("http://localhost:3000/api/admin/premium/plans", postSpy));

    renderPremium();
    await screen.findByText("Aylık Premium");

    fireEvent.click(screen.getByRole("button", { name: "+ Yeni Plan" }));
    fireEvent.click(screen.getByRole("button", { name: "Oluştur" }));

    expect(window.alert).toHaveBeenCalledWith("Ad, fiyat ve süre zorunlu");
    expect(postSpy).not.toHaveBeenCalled();
  });

  it("plan düzenlenir ve PATCH isteği gönderilir", async () => {
    let patchBody: unknown;
    server.use(
      http.patch("http://localhost:3000/api/admin/premium/plans/:id", async ({ request }) => {
        patchBody = await request.json();
        return HttpResponse.json({ ok: true });
      })
    );

    renderPremium();
    const editBtns = await screen.findAllByRole("button", { name: "Düzenle" });
    fireEvent.click(editBtns[0]);

    // Ad alanını değiştir
    const nameInput = screen.getAllByRole("textbox")[0];
    fireEvent.change(nameInput, { target: { value: "Aylık Premium Pro" } });

    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));

    await waitFor(() => {
      expect(patchBody).toMatchObject({ name: "Aylık Premium Pro" });
    });
  });

  it("Pasifleştir butonuna tıklanınca isActive false gönderilir", async () => {
    let patchBody: unknown;
    server.use(
      http.patch("http://localhost:3000/api/admin/premium/plans/:id", async ({ request }) => {
        patchBody = await request.json();
        return HttpResponse.json({ ok: true });
      })
    );

    renderPremium();
    const toggleBtns = await screen.findAllByRole("button", { name: "Pasifleştir" });
    fireEvent.click(toggleBtns[0]);

    await waitFor(() => {
      expect(patchBody).toEqual({ isActive: false });
    });
  });

  it("Aktifleştir butonuna tıklanınca isActive true gönderilir", async () => {
    let patchBody: unknown;
    server.use(
      http.patch("http://localhost:3000/api/admin/premium/plans/:id", async ({ request }) => {
        patchBody = await request.json();
        return HttpResponse.json({ ok: true });
      })
    );

    renderPremium();
    const toggleBtns = await screen.findAllByRole("button", { name: "Aktifleştir" });
    fireEvent.click(toggleBtns[0]);

    await waitFor(() => {
      expect(patchBody).toEqual({ isActive: true });
    });
  });

  it("plan silinir: confirm onaylanınca DELETE isteği gönderilir", async () => {
    renderPremium();
    // İlk yükleme tamamlansın
    await screen.findByText("Aylık Premium");

    let deletedId: string | undefined;
    server.use(
      http.delete("http://localhost:3000/api/admin/premium/plans/:id", ({ params }) => {
        deletedId = params.id as string;
        return HttpResponse.json({ ok: true });
      }),
      http.get("http://localhost:3000/api/admin/premium/plans", () =>
        HttpResponse.json([premiumPlans[1]])
      )
    );

    const deleteBtns = screen.getAllByRole("button", { name: "Sil" });
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(deletedId).toBe("plan-1");
    });
  });

  it("plan yükleme hatası hata mesajı gösterir", async () => {
    server.use(
      http.get("http://localhost:3000/api/admin/premium/plans", () =>
        HttpResponse.json({ error: "Plan veritabanı hatası" }, { status: 500 })
      )
    );

    renderPremium();
    expect(await screen.findByText("Plan veritabanı hatası")).toBeInTheDocument();
  });
});

describe("Premium Integration — Kullanıcı Premium Yönetimi", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  async function goToUsersTab() {
    renderPremium();
    fireEvent.click(screen.getByRole("button", { name: "Kullanıcılar" }));
    await screen.findByText("Aktif Premium");
  }

  it("Kullanıcılar tabında istatistikler ve tablo gösterilir", async () => {
    await goToUsersTab();

    expect(screen.getByText("1")).toBeInTheDocument(); // 1 premium
    expect(screen.getByText("3")).toBeInTheDocument(); // 3 toplam
    expect(screen.getByText("Premium Kullanıcı")).toBeInTheDocument();
    expect(screen.getByText("Normal Kullanıcı")).toBeInTheDocument();
  });

  it("Premium Ver akışı: plan seçilir ve grant API'ı çağrılır", async () => {
    let grantedUserId: string | undefined;
    let grantedPlanId: string | undefined;

    server.use(
      http.post("http://localhost:3000/api/admin/premium/users/:userId/grant", async ({ params, request }) => {
        grantedUserId = params.userId as string;
        const body = await request.json() as { planId: string };
        grantedPlanId = body.planId;
        return HttpResponse.json({ ok: true, premiumUntil: "2025-06-01T00:00:00Z" });
      })
    );

    await goToUsersTab();

    // adminUser ve regularUser her ikisi de non-premium → iki "Premium Ver" butonu
    // "Normal Kullanıcı" satırındaki butona tıklıyoruz
    const normalRow = screen.getByText("Normal Kullanıcı").closest("tr")!;
    fireEvent.click(normalRow.querySelector("button")!);

    // Plan seçici açılır — sadece aktif planlar görünür (plan-1)
    const planSelect = screen.getByRole("combobox");
    fireEvent.change(planSelect, { target: { value: "plan-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Ver" }));

    await waitFor(() => {
      expect(grantedUserId).toBe("user-1");
      expect(grantedPlanId).toBe("plan-1");
    });
  });

  it("Premium Kaldır akışı: confirm sonrası revoke API'ı çağrılır", async () => {
    let revokedUserId: string | undefined;
    server.use(
      http.delete("http://localhost:3000/api/admin/premium/users/:userId/grant", ({ params }) => {
        revokedUserId = params.userId as string;
        return HttpResponse.json({ ok: true });
      })
    );

    await goToUsersTab();

    // premiumUser satırındaki "Kaldır" butonu
    const premiumRow = screen.getByText("Premium Kullanıcı").closest("tr")!;
    fireEvent.click(premiumRow.querySelector("button")!);

    await waitFor(() => {
      expect(revokedUserId).toBe("user-2");
    });
  });

  it("arama metniyle kullanıcılar client-side filtrelenir", async () => {
    await goToUsersTab();

    fireEvent.change(screen.getByPlaceholderText("İsim veya e-posta ara..."), {
      target: { value: "premium" },
    });

    expect(screen.getByText("Premium Kullanıcı")).toBeInTheDocument();
    expect(screen.queryByText("Normal Kullanıcı")).not.toBeInTheDocument();
  });

  it("plan seçmeden Ver'e basılınca alert gösterilir", async () => {
    await goToUsersTab();

    // Normal Kullanıcı satırındaki "Premium Ver" butonuna tıkla
    const normalRow = screen.getByText("Normal Kullanıcı").closest("tr")!;
    fireEvent.click(normalRow.querySelector("button")!);

    // Plan seçmeden doğrudan Ver'e bas
    fireEvent.click(screen.getByRole("button", { name: "Ver" }));

    expect(window.alert).toHaveBeenCalledWith("Plan seçin");
  });

  it("tab geçişi yapılınca Plans içeriği tekrar yüklenir", async () => {
    renderPremium();
    await screen.findByText("Aylık Premium");

    fireEvent.click(screen.getByRole("button", { name: "Kullanıcılar" }));
    await screen.findByText("Aktif Premium");

    fireEvent.click(screen.getByRole("button", { name: "Planlar" }));
    expect(await screen.findByText("Aylık Premium")).toBeInTheDocument();
  });
});
