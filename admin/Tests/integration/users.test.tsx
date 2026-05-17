/**
 * Users (Kullanıcı Yönetimi) integration tests
 *
 * Gerçek api.ts fetch zinciri + MSW kullanılır.
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./setup";
import { AuthProvider } from "../../src/AuthContext";
import UsersPage from "../../src/pages/UsersPage";
import { adminUser, regularUser, premiumUser } from "./handlers";

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderUsers(currentUserId = "admin-1") {
  const me = { ...adminUser, id: currentUserId };
  localStorage.setItem("admin_token", "fake-jwt-token");
  localStorage.setItem("admin_user", JSON.stringify(me));
  return render(
    <MemoryRouter>
      <AuthProvider>
        <UsersPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Users Integration — Kullanıcı Yönetimi", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("tüm kullanıcıları API'dan yükler ve tabloda gösterir", async () => {
    renderUsers();

    expect(await screen.findByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("Normal Kullanıcı")).toBeInTheDocument();
    expect(screen.getByText("Premium Kullanıcı")).toBeInTheDocument();
    expect(screen.getByText("admin@goworldy.com")).toBeInTheDocument();
    expect(screen.getByText("user@test.com")).toBeInTheDocument();
  });

  it("arama metni ≥ 2 karakter: API'a query parametresiyle istek gider", async () => {
    renderUsers();
    // İlk yükleme tamamlansın
    await screen.findByText("Admin User");

    // Arama için handler'ı SONRA override et
    let capturedQuery: string | null = null;
    server.use(
      http.get("http://localhost:3000/api/admin/users", ({ request }) => {
        const url = new URL(request.url);
        capturedQuery = url.searchParams.get("search");
        return HttpResponse.json([regularUser]);
      })
    );

    fireEvent.change(screen.getByPlaceholderText("İsim veya e-posta ara..."), {
      target: { value: "normal" },
    });

    await waitFor(() => {
      expect(capturedQuery).toBe("normal");
      expect(screen.getByText("Normal Kullanıcı")).toBeInTheDocument();
    });
  });

  it("arama sonuçları düzgün filtrelenir (sunucu tarafı)", async () => {
    renderUsers();
    await screen.findByText("Admin User");

    // Sunucu sadece premium kullanıcıyı döndürüyor
    server.use(
      http.get("http://localhost:3000/api/admin/users", () =>
        HttpResponse.json([premiumUser])
      )
    );

    fireEvent.change(screen.getByPlaceholderText("İsim veya e-posta ara..."), {
      target: { value: "premium" },
    });

    await waitFor(() => {
      expect(screen.getByText("Premium Kullanıcı")).toBeInTheDocument();
      expect(screen.queryByText("Normal Kullanıcı")).not.toBeInTheDocument();
    });
  });

  it("rol dropdown değişince PATCH isteği gönderilir", async () => {
    let patchedId: string | undefined;
    let patchedRole: string | undefined;
    server.use(
      http.patch("http://localhost:3000/api/admin/users/:id/role", async ({ params, request }) => {
        patchedId = params.id as string;
        const body = await request.json() as { role: string };
        patchedRole = body.role;
        return HttpResponse.json({ ok: true });
      })
    );

    renderUsers();
    await screen.findByText("Normal Kullanıcı");

    const selects = screen.getAllByRole("combobox");
    // İlk select admin-1 (disabled), ikincisi user-1
    const userSelect = selects.find((s) => !(s as HTMLSelectElement).disabled)!;
    fireEvent.change(userSelect, { target: { value: "moderator" } });

    await waitFor(() => {
      expect(patchedRole).toBe("moderator");
      expect(patchedId).toBeDefined();
    });
  });

  it("rol değişikliği sonrası liste güncellenir (UI yansır)", async () => {
    server.use(
      http.patch("http://localhost:3000/api/admin/users/:id/role", async () =>
        HttpResponse.json({ ok: true })
      )
    );

    renderUsers();
    await screen.findByText("Normal Kullanıcı");

    const selects = screen.getAllByRole("combobox");
    const userSelect = selects.find((s) => !(s as HTMLSelectElement).disabled)!;
    fireEvent.change(userSelect, { target: { value: "moderator" } });

    await waitFor(() => {
      expect((userSelect as HTMLSelectElement).value).toBe("moderator");
    });
  });

  it("kendi hesabının rol dropdown'ı disabled olur", async () => {
    renderUsers("admin-1"); // admin-1 olarak giriş yaptık
    await screen.findByText("Admin User");

    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    const mySelect = selects.find((s) => {
      // admin user satırındaki select
      const row = s.closest("tr");
      return row?.textContent?.includes("Admin User");
    });
    expect(mySelect).toBeDisabled();
  });

  it("rol güncelleme hatası: hata mesajı gösterilir", async () => {
    server.use(
      http.patch("http://localhost:3000/api/admin/users/:id/role", () =>
        HttpResponse.json({ error: "Yetki yetersiz" }, { status: 403 })
      )
    );

    renderUsers();
    await screen.findByText("Normal Kullanıcı");

    const selects = screen.getAllByRole("combobox");
    const userSelect = selects.find((s) => !(s as HTMLSelectElement).disabled)!;
    fireEvent.change(userSelect, { target: { value: "moderator" } });

    expect(await screen.findByText("Yetki yetersiz")).toBeInTheDocument();
  });

  it("liste yükleme hatası: hata mesajı gösterilir", async () => {
    server.use(
      http.get("http://localhost:3000/api/admin/users", () =>
        HttpResponse.json({ error: "Veritabanı hatası" }, { status: 500 })
      )
    );

    renderUsers();
    expect(await screen.findByText("Veritabanı hatası")).toBeInTheDocument();
  });

  it("premium kullanıcının ✅ işareti gösterilir", async () => {
    renderUsers();
    await screen.findByText("Premium Kullanıcı");

    const premiumRow = screen.getByText("Premium Kullanıcı").closest("tr")!;
    expect(premiumRow.textContent).toContain("✅");
  });

  it("1 karakter aramada query parametresi gönderilmez (undefined)", async () => {
    renderUsers();
    await screen.findByText("Admin User");

    const capturedQueries: (string | null)[] = [];
    server.use(
      http.get("http://localhost:3000/api/admin/users", ({ request }) => {
        capturedQueries.push(new URL(request.url).searchParams.get("search"));
        return HttpResponse.json([adminUser, regularUser, premiumUser]);
      })
    );

    fireEvent.change(screen.getByPlaceholderText("İsim veya e-posta ara..."), {
      target: { value: "a" },
    });

    await waitFor(() => expect(capturedQueries.length).toBeGreaterThan(0));
    expect(capturedQueries[capturedQueries.length - 1]).toBeNull();
  });
});
