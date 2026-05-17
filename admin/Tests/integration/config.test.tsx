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

    // Section başlıkları
    expect(await screen.findByText("Uygulama")).toBeInTheDocument();
    expect(screen.getByText("Forum Fiyatlandırması")).toBeInTheDocument();
    expect(screen.getByText("Premium Fiyatlandırması")).toBeInTheDocument();
    expect(screen.getByText("Rehber")).toBeInTheDocument();
  });

  it("uygulama bilgileri doğru gösterilir", async () => {
    renderConfig();

    expect(await screen.findByText("GoWorldy")).toBeInTheDocument();
    expect(screen.getByText("1.2.0")).toBeInTheDocument();
    expect(screen.getByText("https://goworldy.com")).toBeInTheDocument();
  });

  it("forum fiyatları TL suffix ile gösterilir", async () => {
    renderConfig();

    await screen.findByText("Forum Fiyatlandırması");
    expect(screen.getByText("10 TL")).toBeInTheDocument();
    expect(screen.getByText("5 TL")).toBeInTheDocument();
    expect(screen.getByText("50 TL")).toBeInTheDocument();
    expect(screen.getByText("20 TL")).toBeInTheDocument();
  });

  it("premium fiyatları gösterilir", async () => {
    renderConfig();

    await screen.findByText("Premium Fiyatlandırması");
    expect(screen.getByText("29 TL")).toBeInTheDocument();
    expect(screen.getByText("99 TL")).toBeInTheDocument();
  });

  it("boolean değerler ✅ Etkin / ❌ Devre Dışı olarak gösterilir", async () => {
    renderConfig();

    await screen.findByText("Rehber");
    // enableNotifications: true, enableRecommendations: true → iki ✅ Etkin
    const etkinItems = screen.getAllByText("✅ Etkin");
    expect(etkinItems.length).toBeGreaterThanOrEqual(2);

    // enableInApp: false → bir ❌ Devre Dışı
    const devreDisi = screen.getAllByText("❌ Devre Dışı");
    expect(devreDisi.length).toBeGreaterThanOrEqual(1);
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

    // Veri geldikten sonra loading kalkar ve içerik görünür
    await waitFor(() => {
      expect(screen.queryByText("Yükleniyor...")).not.toBeInTheDocument();
    });
    expect(screen.getByText("GoWorldy")).toBeInTheDocument();
    expect(screen.getByText("Forum Fiyatlandırması")).toBeInTheDocument();
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
