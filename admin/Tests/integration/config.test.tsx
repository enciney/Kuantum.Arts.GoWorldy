/**
 * Config (Sistem Ayarları) + Dashboard integration tests
 *
 * Gerçek api.ts fetch zinciri + MSW kullanılır.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./setup";
import { AuthProvider } from "../../src/AuthContext";
import ConfigPage from "../../src/pages/ConfigPage";
import DashboardPage from "../../src/pages/DashboardPage";
import { adminUser, dashboardStats } from "./handlers";

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderConfig() {
  localStorage.setItem("admin_token", "fake-jwt-token");
  localStorage.setItem("admin_user", JSON.stringify(adminUser));
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ConfigPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

function renderDashboard() {
  localStorage.setItem("admin_token", "fake-jwt-token");
  localStorage.setItem("admin_user", JSON.stringify(adminUser));
  return render(
    <MemoryRouter>
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

// ── Config Tests ─────────────────────────────────────────────────────────────

describe("Config Integration — Sistem Ayarları", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("config API'dan yüklenir ve tüm section'lar görüntülenir", async () => {
    renderConfig();

    expect(await screen.findByText("Uygulama")).toBeInTheDocument();
    expect(screen.getByText("Sunucu")).toBeInTheDocument();
    expect(screen.getByText("Yönetici")).toBeInTheDocument();
    expect(screen.getByText("Entegrasyonlar")).toBeInTheDocument();
  });

  it("uygulama bilgileri doğru gösterilir", async () => {
    renderConfig();

    expect(await screen.findByText("GoWorldy")).toBeInTheDocument();
    expect(screen.getByText("1.2.0")).toBeInTheDocument();
    expect(screen.getByText("https://goworldy.com")).toBeInTheDocument();
  });

  it("sunucu bilgileri doğru gösterilir", async () => {
    renderConfig();

    await screen.findByText("Sunucu");
    expect(screen.getByText("3000")).toBeInTheDocument();
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("7d")).toBeInTheDocument();
  });

  it("admin e-postası gösterilir", async () => {
    renderConfig();

    await screen.findByText("Yönetici");
    expect(screen.getByText("admin@goworldy.com")).toBeInTheDocument();
  });

  it("entegrasyon durumları ✅ Yapılandırıldı / ❌ Yapılandırılmadı olarak gösterilir", async () => {
    renderConfig();

    await screen.findByText("Entegrasyonlar");
    // firebaseConfigured=true, sendgridConfigured=true → iki ✅ Yapılandırıldı
    const configured = screen.getAllByText("✅ Yapılandırıldı");
    expect(configured.length).toBeGreaterThanOrEqual(2);

    // stripeConfigured=false, googleAuthConfigured=false → iki ❌ Yapılandırılmadı
    const notConfigured = screen.getAllByText("❌ Yapılandırılmadı");
    expect(notConfigured.length).toBeGreaterThanOrEqual(2);
  });

  it("salt okunur uyarısı görüntülenir", async () => {
    renderConfig();
    expect(await screen.findByText(/salt okunur/)).toBeInTheDocument();
  });

  it("API hatası durumunda hata mesajı gösterilir", async () => {
    server.use(
      http.get("http://localhost:3000/api/admin/config", () =>
        HttpResponse.json({ error: "Config erişim hatası" }, { status: 500 })
      )
    );

    renderConfig();
    expect(await screen.findByText("Config erişim hatası")).toBeInTheDocument();

    // Hata varken section'lar görüntülenmemeli
    expect(screen.queryByText("Uygulama")).not.toBeInTheDocument();
  });

  it("401 durumunda hata mesajı gösterilir", async () => {
    server.use(
      http.get("http://localhost:3000/api/admin/config", () =>
        HttpResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
      )
    );

    renderConfig();
    expect(await screen.findByText("Yetkisiz erişim")).toBeInTheDocument();
  });

  it("yükleme tamamlanınca 'Yükleniyor...' kaybolur ve veriler gösterilir", async () => {
    renderConfig();

    await waitFor(() => {
      expect(screen.queryByText("Yükleniyor...")).not.toBeInTheDocument();
    });
    expect(screen.getByText("GoWorldy")).toBeInTheDocument();
    expect(screen.getByText("Sunucu")).toBeInTheDocument();
  });
});

// ── Dashboard Tests ───────────────────────────────────────────────────────────

describe("Dashboard Integration — Ana Ekran", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("istatistik kartları API verileriyle doldurulur", async () => {
    renderDashboard();

    // Turkish locale: 142 → "142", 38 → "38", 276 → "276", 12 → "12"
    expect(await screen.findByText("142")).toBeInTheDocument();
    expect(screen.getByText("38")).toBeInTheDocument();
    expect(screen.getByText("276")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("kart etiketleri doğru gösterilir", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Toplam Kullanıcı")).toBeInTheDocument();
      expect(screen.getByText("Toplam Konu")).toBeInTheDocument();
      expect(screen.getByText("Toplam Yorum")).toBeInTheDocument();
      expect(screen.getByText("Ülke Sayısı")).toBeInTheDocument();
    });
  });

  it("1.000+ değerler Türkçe locale ile formatlanır", async () => {
    server.use(
      http.get("http://localhost:3000/api/admin/dashboard", () =>
        HttpResponse.json({ stats: { ...dashboardStats, totalComments: 1500 } })
      )
    );

    renderDashboard();
    // Türkçe locale: 1.500
    expect(await screen.findByText("1.500")).toBeInTheDocument();
  });

  it("hızlı bağlantılar /topics ve /users'a yönlendirir", async () => {
    renderDashboard();

    await screen.findByText("Hızlı Bağlantılar");
    expect(screen.getByText("Konu Onay Kuyruğu →").closest("a")).toHaveAttribute("href", "/topics");
    expect(screen.getByText("Kullanıcı Yönetimi →").closest("a")).toHaveAttribute("href", "/users");
  });

  it("dashboard API hatası durumunda hata mesajı gösterilir", async () => {
    server.use(
      http.get("http://localhost:3000/api/admin/dashboard", () =>
        HttpResponse.json({ error: "Dashboard verisi alınamadı" }, { status: 500 })
      )
    );

    renderDashboard();
    expect(await screen.findByText("Dashboard verisi alınamadı")).toBeInTheDocument();
  });

  it("yüklenme öncesinde kartlarda — gösterilir", () => {
    // Cevabı askıya al
    server.use(
      http.get("http://localhost:3000/api/admin/dashboard", async () => {
        await new Promise(() => {});
        return HttpResponse.json({});
      })
    );

    renderDashboard();
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBe(4);
  });
});
