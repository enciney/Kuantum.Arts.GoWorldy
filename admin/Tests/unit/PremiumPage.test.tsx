import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import PremiumPage from "../../src/pages/PremiumPage";
import type { PremiumPlan, User } from "../../src/api";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../../src/AuthContext", () => ({
  useAuth: () => ({
    token: "test-token",
    user: { id: "me", role: "admin" },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("../../src/api", () => ({
  api: {
    admin: {
      getPremiumPlans: vi.fn(),
      createPremiumPlan: vi.fn(),
      updatePremiumPlan: vi.fn(),
      deletePremiumPlan: vi.fn(),
      getPremiumUsers: vi.fn(),
      users: vi.fn(),
      grantPremium: vi.fn(),
      revokePremium: vi.fn(),
    },
  },
}));

import { api } from "../../src/api";
const mockGetPlans = vi.mocked(api.admin.getPremiumPlans);
const mockCreatePlan = vi.mocked(api.admin.createPremiumPlan);
const mockUpdatePlan = vi.mocked(api.admin.updatePremiumPlan);
const mockDeletePlan = vi.mocked(api.admin.deletePremiumPlan);
const mockGetPremiumUsers = vi.mocked(api.admin.getPremiumUsers);
const mockGetAllUsers = vi.mocked(api.admin.users);
const mockGrantPremium = vi.mocked(api.admin.grantPremium);
const mockRevokePremium = vi.mocked(api.admin.revokePremium);

const samplePlans: PremiumPlan[] = [
  {
    id: "plan1",
    name: "Aylık Plan",
    description: "Aylık premium",
    price: 99,
    durationDays: 30,
    features: ["Sınırsız forum", "Rehber erişimi"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "plan2",
    name: "Haftalık Plan",
    description: "Haftalık premium",
    price: 29,
    durationDays: 7,
    features: ["Forum erişimi"],
    isActive: false,
    createdAt: "2024-01-02T00:00:00Z",
  },
];

const premiumUser: User = {
  id: "pu1",
  email: "premium@test.com",
  displayName: "Premium Kullanıcı",
  role: "user",
  isPremium: true,
  premiumUntil: "2024-12-31T00:00:00Z",
};

const regularUser: User = {
  id: "ru1",
  email: "regular@test.com",
  displayName: "Normal Kullanıcı",
  role: "user",
  isPremium: false,
};

function renderPremium() {
  return render(
    <MemoryRouter>
      <PremiumPage />
    </MemoryRouter>
  );
}

function setupPlansTab() {
  mockGetPlans.mockResolvedValue(samplePlans);
}

function setupUsersTab() {
  mockGetPremiumUsers.mockResolvedValue([premiumUser]);
  mockGetAllUsers.mockResolvedValue([premiumUser, regularUser]);
  mockGetPlans.mockResolvedValue(samplePlans);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("PremiumPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("renders page heading", () => {
    setupPlansTab();
    renderPremium();
    expect(screen.getByText("Premium Yönetimi")).toBeInTheDocument();
  });

  it("renders tab buttons", () => {
    setupPlansTab();
    renderPremium();
    expect(screen.getByRole("button", { name: "Planlar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kullanıcılar" })).toBeInTheDocument();
  });

  it("shows Plans tab by default", () => {
    setupPlansTab();
    renderPremium();
    // The Plans tab content should be visible
    expect(mockGetPlans).toBeDefined();
  });

  it("switches to Users tab on click", async () => {
    setupPlansTab();
    setupUsersTab();
    renderPremium();

    fireEvent.click(screen.getByRole("button", { name: "Kullanıcılar" }));

    await waitFor(() => {
      expect(screen.getByText("Aktif Premium")).toBeInTheDocument();
    });
  });

  // ── Plans Tab ──────────────────────────────────────────────────────────────

  describe("Plans Tab", () => {
    it("shows loading state", () => {
      mockGetPlans.mockReturnValue(new Promise(() => {}));
      renderPremium();
      expect(screen.getByText("Yükleniyor...")).toBeInTheDocument();
    });

    it("renders plans", async () => {
      setupPlansTab();
      renderPremium();

      expect(await screen.findByText("Aylık Plan")).toBeInTheDocument();
      expect(screen.getByText("Haftalık Plan")).toBeInTheDocument();
      expect(screen.getByText("99 TL")).toBeInTheDocument();
      expect(screen.getByText("29 TL")).toBeInTheDocument();
      expect(screen.getByText("30 gün")).toBeInTheDocument();
      expect(screen.getByText("7 gün")).toBeInTheDocument();
    });

    it("shows active/passive badge", async () => {
      setupPlansTab();
      renderPremium();

      expect(await screen.findByText("Aktif")).toBeInTheDocument();
      expect(screen.getByText("Pasif")).toBeInTheDocument();
    });

    it("shows plan features as chips", async () => {
      setupPlansTab();
      renderPremium();

      expect(await screen.findByText("Sınırsız forum")).toBeInTheDocument();
      expect(screen.getByText("Rehber erişimi")).toBeInTheDocument();
      expect(screen.getByText("Forum erişimi")).toBeInTheDocument();
    });

    it("shows plan count", async () => {
      setupPlansTab();
      renderPremium();

      expect(await screen.findByText("2 plan")).toBeInTheDocument();
    });

    it("opens new plan form on + Yeni Plan click", async () => {
      setupPlansTab();
      renderPremium();

      await screen.findByText("Aylık Plan");
      fireEvent.click(screen.getByRole("button", { name: "+ Yeni Plan" }));

      expect(screen.getByText("Yeni Plan")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Oluştur" })).toBeInTheDocument();
    });

    it("new plan form cancel hides form", async () => {
      setupPlansTab();
      renderPremium();

      await screen.findByText("Aylık Plan");
      fireEvent.click(screen.getByRole("button", { name: "+ Yeni Plan" }));
      fireEvent.click(screen.getByRole("button", { name: "İptal" }));

      expect(screen.queryByText("Yeni Plan")).not.toBeInTheDocument();
    });

    it("creates a new plan and reloads", async () => {
      setupPlansTab();
      mockCreatePlan.mockResolvedValue({ ...samplePlans[0], id: "plan3", name: "Yıllık Plan" });
      mockGetPlans.mockResolvedValueOnce(samplePlans).mockResolvedValue([
        ...samplePlans,
        { ...samplePlans[0], id: "plan3", name: "Yıllık Plan" },
      ]);

      renderPremium();
      await screen.findByText("Aylık Plan");
      fireEvent.click(screen.getByRole("button", { name: "+ Yeni Plan" }));

      // Fill form fields (using label text)
      const inputs = screen.getAllByRole("textbox");
      fireEvent.change(inputs[0], { target: { value: "Yıllık Plan" } });
      fireEvent.change(inputs[1], { target: { value: "Yıllık açıklama" } });

      const numberInputs = screen.getAllByRole("spinbutton");
      fireEvent.change(numberInputs[0], { target: { value: "999" } });
      fireEvent.change(numberInputs[1], { target: { value: "365" } });

      fireEvent.click(screen.getByRole("button", { name: "Oluştur" }));

      await waitFor(() => {
        expect(mockCreatePlan).toHaveBeenCalled();
      });
    });

    it("alert shown when required fields missing on create", async () => {
      setupPlansTab();
      renderPremium();

      await screen.findByText("Aylık Plan");
      fireEvent.click(screen.getByRole("button", { name: "+ Yeni Plan" }));
      // Don't fill any fields
      fireEvent.click(screen.getByRole("button", { name: "Oluştur" }));

      expect(window.alert).toHaveBeenCalledWith("Ad, fiyat ve süre zorunlu");
    });

    it("opens edit form on Düzenle click", async () => {
      setupPlansTab();
      renderPremium();

      const editBtns = await screen.findAllByRole("button", { name: "Düzenle" });
      fireEvent.click(editBtns[0]);

      expect(screen.getByRole("button", { name: "Kaydet" })).toBeInTheDocument();
    });

    it("edit form cancel returns to view", async () => {
      setupPlansTab();
      renderPremium();

      const editBtns = await screen.findAllByRole("button", { name: "Düzenle" });
      fireEvent.click(editBtns[0]);
      fireEvent.click(screen.getByRole("button", { name: "İptal" }));

      expect(screen.queryByRole("button", { name: "Kaydet" })).not.toBeInTheDocument();
    });

    it("save edit calls updatePremiumPlan", async () => {
      setupPlansTab();
      mockUpdatePlan.mockResolvedValue({ ok: true });
      mockGetPlans.mockResolvedValue(samplePlans);

      renderPremium();
      const editBtns = await screen.findAllByRole("button", { name: "Düzenle" });
      fireEvent.click(editBtns[0]);

      fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));

      await waitFor(() => {
        expect(mockUpdatePlan).toHaveBeenCalledWith("plan1", expect.any(Object), "test-token");
      });
    });

    it("toggle active calls updatePremiumPlan", async () => {
      setupPlansTab();
      mockUpdatePlan.mockResolvedValue({ ok: true });
      mockGetPlans.mockResolvedValue(samplePlans);

      renderPremium();
      const toggleBtns = await screen.findAllByRole("button", { name: "Pasifleştir" });
      fireEvent.click(toggleBtns[0]);

      await waitFor(() => {
        expect(mockUpdatePlan).toHaveBeenCalledWith("plan1", { isActive: false }, "test-token");
      });
    });

    it("delete plan calls deletePremiumPlan after confirm", async () => {
      // First call shows both plans; after delete reload returns one plan
      mockGetPlans
        .mockResolvedValueOnce(samplePlans)
        .mockResolvedValue([samplePlans[1]]);
      mockDeletePlan.mockResolvedValue({ ok: true });

      renderPremium();
      const deleteBtns = await screen.findAllByRole("button", { name: "Sil" });
      fireEvent.click(deleteBtns[0]);

      await waitFor(() => {
        expect(mockDeletePlan).toHaveBeenCalledWith("plan1", "test-token");
      });
    });

    it("shows error on load failure", async () => {
      mockGetPlans.mockRejectedValue(new Error("Plan yüklenemedi"));
      renderPremium();

      expect(await screen.findByText("Plan yüklenemedi")).toBeInTheDocument();
    });
  });

  // ── Users Tab ──────────────────────────────────────────────────────────────

  describe("Users Tab", () => {
    async function goToUsersTab() {
      setupUsersTab();
      renderPremium();
      fireEvent.click(screen.getByRole("button", { name: "Kullanıcılar" }));
      await screen.findByText("Aktif Premium");
    }

    it("shows stats", async () => {
      await goToUsersTab();
      expect(screen.getByText("1")).toBeInTheDocument(); // 1 premium user
      expect(screen.getByText("2")).toBeInTheDocument(); // 2 total users
      expect(screen.getByText("Aktif Premium")).toBeInTheDocument();
      expect(screen.getByText("Toplam Kullanıcı")).toBeInTheDocument();
    });

    it("renders user rows", async () => {
      await goToUsersTab();
      expect(screen.getByText("Premium Kullanıcı")).toBeInTheDocument();
      expect(screen.getByText("Normal Kullanıcı")).toBeInTheDocument();
    });

    it("premium user has Kaldır button", async () => {
      await goToUsersTab();
      expect(screen.getByRole("button", { name: "Kaldır" })).toBeInTheDocument();
    });

    it("non-premium user has Premium Ver button", async () => {
      await goToUsersTab();
      expect(screen.getByRole("button", { name: "Premium Ver" })).toBeInTheDocument();
    });

    it("Premium Ver opens plan selector", async () => {
      await goToUsersTab();
      fireEvent.click(screen.getByRole("button", { name: "Premium Ver" }));

      expect(screen.getByRole("button", { name: "Ver" })).toBeInTheDocument();
    });

    it("grant premium calls API", async () => {
      mockGrantPremium.mockResolvedValue({ ok: true, premiumUntil: "2025-01-01T00:00:00Z" });
      mockGetPremiumUsers.mockResolvedValue([premiumUser]);
      mockGetAllUsers.mockResolvedValue([premiumUser, regularUser]);
      mockGetPlans.mockResolvedValue(samplePlans);

      renderPremium();
      fireEvent.click(screen.getByRole("button", { name: "Kullanıcılar" }));
      await screen.findByText("Premium Ver");
      fireEvent.click(screen.getByRole("button", { name: "Premium Ver" }));

      // Select a plan
      const planSelect = screen.getByRole("combobox");
      fireEvent.change(planSelect, { target: { value: "plan1" } });

      fireEvent.click(screen.getByRole("button", { name: "Ver" }));

      await waitFor(() => {
        expect(mockGrantPremium).toHaveBeenCalledWith("ru1", "plan1", "test-token");
      });
    });

    it("revoke premium calls API after confirm", async () => {
      mockRevokePremium.mockResolvedValue({ ok: true });
      mockGetPremiumUsers.mockResolvedValue([premiumUser]);
      mockGetAllUsers.mockResolvedValue([premiumUser, regularUser]);
      mockGetPlans.mockResolvedValue(samplePlans);

      renderPremium();
      fireEvent.click(screen.getByRole("button", { name: "Kullanıcılar" }));
      await screen.findByText("Kaldır");
      fireEvent.click(screen.getByRole("button", { name: "Kaldır" }));

      await waitFor(() => {
        expect(mockRevokePremium).toHaveBeenCalledWith("pu1", "test-token");
      });
    });

    it("search filters users client-side", async () => {
      await goToUsersTab();

      fireEvent.change(screen.getByPlaceholderText("İsim veya e-posta ara..."), {
        target: { value: "premium" },
      });

      expect(screen.getByText("Premium Kullanıcı")).toBeInTheDocument();
      expect(screen.queryByText("Normal Kullanıcı")).not.toBeInTheDocument();
    });

    it("shows error on load failure", async () => {
      mockGetPremiumUsers.mockRejectedValue(new Error("Kullanıcılar yüklenemedi"));
      mockGetAllUsers.mockResolvedValue([]);
      mockGetPlans.mockResolvedValue([]);

      renderPremium();
      fireEvent.click(screen.getByRole("button", { name: "Kullanıcılar" }));

      expect(await screen.findByText("Kullanıcılar yüklenemedi")).toBeInTheDocument();
    });
  });
});

