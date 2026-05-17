import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ConfigPage from "../../src/pages/ConfigPage";
import type { AdminConfig } from "../../src/api";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../../src/AuthContext", () => ({
  useAuth: () => ({
    token: "test-token",
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("../../src/api", () => ({
  api: {
    admin: {
      config: vi.fn(),
    },
  },
}));

import { api } from "../../src/api";
const mockConfig = vi.mocked(api.admin.config);

const sampleConfig: AdminConfig = {
  app: {
    name: "GoWorldy",
    version: "1.0.0",
    url: "https://goworldy.com",
  },
  forum: {
    createTopicCost: 10,
    commentAccessCost: 5,
    createAdCost: 50,
    weeklyTopicReward: 20,
  },
  premium: {
    weeklyPrice: 29,
    monthlyPrice: 99,
  },
  guide: {
    enableNotifications: true,
    enableRecommendations: false,
  },
  notifications: {
    enableEmail: true,
    enableInApp: false,
  },
};

function renderConfig() {
  return render(
    <MemoryRouter>
      <ConfigPage />
    </MemoryRouter>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("ConfigPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page heading", async () => {
    mockConfig.mockResolvedValue(sampleConfig);
    renderConfig();
    expect(screen.getByText("Sistem Ayarları")).toBeInTheDocument();
  });

  it("shows read-only notice", async () => {
    mockConfig.mockResolvedValue(sampleConfig);
    renderConfig();
    expect(screen.getByText(/salt okunur/)).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    mockConfig.mockReturnValue(new Promise(() => {}));
    renderConfig();
    expect(screen.getByText("Yükleniyor...")).toBeInTheDocument();
  });

  it("calls config API with token", async () => {
    mockConfig.mockResolvedValue(sampleConfig);
    renderConfig();

    await waitFor(() => {
      expect(mockConfig).toHaveBeenCalledWith("test-token");
    });
  });

  it("shows error on API failure", async () => {
    mockConfig.mockRejectedValue(new Error("Config yüklenemedi"));
    renderConfig();

    expect(await screen.findByText("Config yüklenemedi")).toBeInTheDocument();
  });

  it("shows generic error for non-Error rejection", async () => {
    mockConfig.mockRejectedValue("error");
    renderConfig();

    expect(await screen.findByText("Yüklenemedi.")).toBeInTheDocument();
  });

  // ── Section: Uygulama ──────────────────────────────────────────────────────

  describe("Uygulama section", () => {
    it("renders section title", async () => {
      mockConfig.mockResolvedValue(sampleConfig);
      renderConfig();
      expect(await screen.findByText("Uygulama")).toBeInTheDocument();
    });

    it("renders app name", async () => {
      mockConfig.mockResolvedValue(sampleConfig);
      renderConfig();
      expect(await screen.findByText("GoWorldy")).toBeInTheDocument();
    });

    it("renders app version", async () => {
      mockConfig.mockResolvedValue(sampleConfig);
      renderConfig();
      expect(await screen.findByText("1.0.0")).toBeInTheDocument();
    });

    it("renders app URL", async () => {
      mockConfig.mockResolvedValue(sampleConfig);
      renderConfig();
      expect(await screen.findByText("https://goworldy.com")).toBeInTheDocument();
    });
  });

  // ── Section: Forum Fiyatlandırması ─────────────────────────────────────────

  describe("Forum Fiyatlandırması section", () => {
    it("renders section title", async () => {
      mockConfig.mockResolvedValue(sampleConfig);
      renderConfig();
      expect(await screen.findByText("Forum Fiyatlandırması")).toBeInTheDocument();
    });

    it("renders forum prices with TL suffix", async () => {
      mockConfig.mockResolvedValue(sampleConfig);
      renderConfig();

      expect(await screen.findByText("10 TL")).toBeInTheDocument(); // createTopicCost
      expect(screen.getByText("5 TL")).toBeInTheDocument();         // commentAccessCost
      expect(screen.getByText("50 TL")).toBeInTheDocument();        // createAdCost
      expect(screen.getByText("20 TL")).toBeInTheDocument();        // weeklyTopicReward
    });

    it("renders row labels", async () => {
      mockConfig.mockResolvedValue(sampleConfig);
      renderConfig();

      await screen.findByText("Forum Fiyatlandırması");
      expect(screen.getByText("Konu Açma Ücreti")).toBeInTheDocument();
      expect(screen.getByText("Yorum Erişim Ücreti")).toBeInTheDocument();
      expect(screen.getByText("Reklam Yayınlama Ücreti")).toBeInTheDocument();
      expect(screen.getByText("Haftalık Konu Ödülü")).toBeInTheDocument();
    });
  });

  // ── Section: Premium Fiyatlandırması ──────────────────────────────────────

  describe("Premium Fiyatlandırması section", () => {
    it("renders section and values", async () => {
      mockConfig.mockResolvedValue(sampleConfig);
      renderConfig();

      expect(await screen.findByText("Premium Fiyatlandırması")).toBeInTheDocument();
      expect(screen.getByText("29 TL")).toBeInTheDocument();
      expect(screen.getByText("99 TL")).toBeInTheDocument();
      expect(screen.getByText("Haftalık Üyelik")).toBeInTheDocument();
      expect(screen.getByText("Aylık Üyelik")).toBeInTheDocument();
    });
  });

  // ── Section: Rehber ───────────────────────────────────────────────────────

  describe("Rehber section", () => {
    it("renders enabled/disabled status", async () => {
      mockConfig.mockResolvedValue(sampleConfig);
      renderConfig();

      await screen.findByText("Rehber");
      // enableNotifications = true → ✅ Etkin
      const etkinItems = screen.getAllByText("✅ Etkin");
      expect(etkinItems.length).toBeGreaterThanOrEqual(1);

      // enableRecommendations = false → ❌ Devre Dışı
      const devreDisi = screen.getAllByText("❌ Devre Dışı");
      expect(devreDisi.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Section: Bildirimler ──────────────────────────────────────────────────

  describe("Bildirimler section", () => {
    it("renders section labels", async () => {
      mockConfig.mockResolvedValue(sampleConfig);
      renderConfig();

      // "Bildirimler" appears twice: once as a section title and once as a row label in Rehber section
      const bildirimlerItems = await screen.findAllByText("Bildirimler");
      expect(bildirimlerItems.length).toBe(2);

      expect(screen.getByText("E-posta Bildirimleri")).toBeInTheDocument();
      expect(screen.getByText("Uygulama İçi Bildirimler")).toBeInTheDocument();
    });
  });

  it("does not render sections before data loads", () => {
    mockConfig.mockReturnValue(new Promise(() => {}));
    renderConfig();

    expect(screen.queryByText("Uygulama")).not.toBeInTheDocument();
    expect(screen.queryByText("Forum Fiyatlandırması")).not.toBeInTheDocument();
  });
});

