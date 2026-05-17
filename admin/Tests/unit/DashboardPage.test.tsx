import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import DashboardPage from "../../src/pages/DashboardPage";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../../src/AuthContext", () => ({
  useAuth: () => ({ token: "test-token", user: null, login: vi.fn(), logout: vi.fn() }),
}));

vi.mock("../../src/api", () => ({
  api: {
    admin: {
      dashboard: vi.fn(),
    },
  },
}));

import { api } from "../../src/api";
const mockDashboard = vi.mocked(api.admin.dashboard);

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders heading", async () => {
    mockDashboard.mockResolvedValue({ totalUsers: 0, totalTopics: 0, totalComments: 0, totalCountries: 0 });
    renderDashboard();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("shows placeholder dashes before data loads", () => {
    mockDashboard.mockReturnValue(new Promise(() => {})); // never resolves
    renderDashboard();

    // All 4 cards show "—" initially
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBe(4);
  });

  it("renders stat cards with API data", async () => {
    mockDashboard.mockResolvedValue({
      totalUsers: 1234,
      totalTopics: 56,
      totalComments: 789,
      totalCountries: 12,
    });

    renderDashboard();

    expect(await screen.findByText("1.234")).toBeInTheDocument(); // Turkish locale
    expect(await screen.findByText("56")).toBeInTheDocument();
    expect(await screen.findByText("789")).toBeInTheDocument();
    expect(await screen.findByText("12")).toBeInTheDocument();
  });

  it("renders card labels", async () => {
    mockDashboard.mockResolvedValue({ totalUsers: 0, totalTopics: 0, totalComments: 0, totalCountries: 0 });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Toplam Kullanıcı")).toBeInTheDocument();
      expect(screen.getByText("Toplam Konu")).toBeInTheDocument();
      expect(screen.getByText("Toplam Yorum")).toBeInTheDocument();
      expect(screen.getByText("Ülke Sayısı")).toBeInTheDocument();
    });
  });

  it("shows error message on API failure", async () => {
    mockDashboard.mockRejectedValue(new Error("Sunucu hatası"));
    renderDashboard();

    expect(await screen.findByText("Sunucu hatası")).toBeInTheDocument();
  });

  it("shows generic error for non-Error rejection", async () => {
    mockDashboard.mockRejectedValue("unknown");
    renderDashboard();

    expect(await screen.findByText("Yüklenemedi.")).toBeInTheDocument();
  });

  it("renders quick navigation links", async () => {
    mockDashboard.mockResolvedValue({ totalUsers: 0, totalTopics: 0, totalComments: 0, totalCountries: 0 });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Hızlı Bağlantılar")).toBeInTheDocument();
    });

    const topicsLink = screen.getByText("Konu Onay Kuyruğu →");
    const usersLink = screen.getByText("Kullanıcı Yönetimi →");

    expect(topicsLink.closest("a")).toHaveAttribute("href", "/topics");
    expect(usersLink.closest("a")).toHaveAttribute("href", "/users");
  });

  it("calls dashboard API with token", async () => {
    mockDashboard.mockResolvedValue({ totalUsers: 5, totalTopics: 3, totalComments: 10, totalCountries: 2 });
    renderDashboard();

    await waitFor(() => {
      expect(mockDashboard).toHaveBeenCalledWith("test-token");
    });
  });

  it("calls dashboard API exactly once on mount", async () => {
    mockDashboard.mockResolvedValue({ totalUsers: 5, totalTopics: 3, totalComments: 10, totalCountries: 2 });
    renderDashboard();

    await waitFor(() => {
      expect(mockDashboard).toHaveBeenCalledTimes(1);
    });
  });
});

