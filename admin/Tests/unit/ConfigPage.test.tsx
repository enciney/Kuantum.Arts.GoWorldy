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
  server: { port: 3000, nodeEnv: "test", jwtExpiry: "7d" },
  admin: { email: "admin@goworldy.com" },
  integrations: {
    firebaseConfigured: true,
    stripeConfigured: false,
    sendgridConfigured: true,
    googleAuthConfigured: false,
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
    expect(screen.getByText("Sistem Yapılandırması")).toBeInTheDocument();
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

  // ── Section: Sunucu ───────────────────────────────────────────────────────

  describe("Sunucu section", () => {
    it("renders section title", async () => {
      mockConfig.mockResolvedValue(sampleConfig);
      renderConfig();
      expect(await screen.findByText("Sunucu")).toBeInTheDocument();
    });

    it("renders port, nodeEnv, jwtExpiry", async () => {
      mockConfig.mockResolvedValue(sampleConfig);
      renderConfig();

      await screen.findByText("Sunucu");
      expect(screen.getByText("3000")).toBeInTheDocument();
      expect(screen.getByText("test")).toBeInTheDocument();
      expect(screen.getByText("7d")).toBeInTheDocument();
    });
  });

  // ── Section: Yönetici ─────────────────────────────────────────────────────

  describe("Yönetici section", () => {
    it("renders admin email", async () => {
      mockConfig.mockResolvedValue(sampleConfig);
      renderConfig();
      expect(await screen.findByText("admin@goworldy.com")).toBeInTheDocument();
    });
  });

  // ── Section: Entegrasyonlar ───────────────────────────────────────────────

  describe("Entegrasyonlar section", () => {
    it("renders section title", async () => {
      mockConfig.mockResolvedValue(sampleConfig);
      renderConfig();
      expect(await screen.findByText("Entegrasyonlar")).toBeInTheDocument();
    });

    it("renders ✅ Yapılandırıldı for true values", async () => {
      mockConfig.mockResolvedValue(sampleConfig);
      renderConfig();

      await screen.findByText("Entegrasyonlar");
      // firebaseConfigured=true, sendgridConfigured=true → 2 rows
      const configured = screen.getAllByText("✅ Yapılandırıldı");
      expect(configured.length).toBeGreaterThanOrEqual(2);
    });

    it("renders ❌ Yapılandırılmadı for false values", async () => {
      mockConfig.mockResolvedValue(sampleConfig);
      renderConfig();

      await screen.findByText("Entegrasyonlar");
      // stripeConfigured=false, googleAuthConfigured=false → 2 rows
      const notConfigured = screen.getAllByText("❌ Yapılandırılmadı");
      expect(notConfigured.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("does not render sections before data loads", () => {
    mockConfig.mockReturnValue(new Promise(() => {}));
    renderConfig();

    expect(screen.queryByText("Uygulama")).not.toBeInTheDocument();
    expect(screen.queryByText("Sunucu")).not.toBeInTheDocument();
    expect(screen.queryByText("Entegrasyonlar")).not.toBeInTheDocument();
  });
});
