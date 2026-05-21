import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import UsersPage from "../../src/pages/UsersPage";
import type { User } from "../../src/api";

// ── Mocks ────────────────────────────────────────────────────────────────────

const currentUser: User = {
  id: "me",
  email: "admin@goworldy.com",
  displayName: "Admin Me",
  role: "admin",
};

vi.mock("../../src/AuthContext", () => ({
  useAuth: () => ({
    token: "test-token",
    user: currentUser,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("../../src/api", () => ({
  api: {
    admin: {
      users: vi.fn(),
      updateUserRole: vi.fn(),
    },
  },
}));

import { api } from "../../src/api";
const mockUsers = vi.mocked(api.admin.users);
const mockUpdateRole = vi.mocked(api.admin.updateUserRole);

const sampleUsers: User[] = [
  {
    id: "me",
    email: "admin@goworldy.com",
    displayName: "Admin Me",
    role: "admin",
    isPremium: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "u2",
    email: "user2@test.com",
    displayName: "Mehmet Demir",
    role: "user",
    userType: "emigrant",
    isPremium: false,
    createdAt: "2024-02-15T00:00:00Z",
  },
  {
    id: "u3",
    email: "mod@test.com",
    displayName: "Zeynep Şahin",
    role: "moderator",
    isPremium: false,
    createdAt: "2024-03-10T00:00:00Z",
  },
];

function renderUsers() {
  return render(
    <MemoryRouter>
      <UsersPage />
    </MemoryRouter>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("UsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page heading", async () => {
    mockUsers.mockResolvedValue([]);
    renderUsers();
    expect(screen.getByText("Kullanıcılar")).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    mockUsers.mockReturnValue(new Promise(() => {}));
    renderUsers();
    expect(screen.getByText("Yükleniyor...")).toBeInTheDocument();
  });

  it("renders users table after load", async () => {
    mockUsers.mockResolvedValue(sampleUsers);
    renderUsers();

    expect(await screen.findByText("Admin Me")).toBeInTheDocument();
    expect(screen.getByText("Mehmet Demir")).toBeInTheDocument();
    expect(screen.getByText("Zeynep Şahin")).toBeInTheDocument();
    expect(screen.getByText("admin@goworldy.com")).toBeInTheDocument();
    expect(screen.getByText("user2@test.com")).toBeInTheDocument();
  });

  it("shows user type label for emigrant", async () => {
    mockUsers.mockResolvedValue(sampleUsers);
    renderUsers();

    expect(await screen.findByText("Göç Etmek İstiyorum")).toBeInTheDocument();
  });

  it("shows premium checkmark for premium users", async () => {
    mockUsers.mockResolvedValue(sampleUsers);
    renderUsers();

    await screen.findByText("Admin Me");
    const premiumCells = screen.getAllByText("✅");
    expect(premiumCells.length).toBeGreaterThan(0);
  });

  it("current user's role dropdown is disabled", async () => {
    mockUsers.mockResolvedValue(sampleUsers);
    renderUsers();

    await screen.findByText("Admin Me");

    // get all role selects — first one is for "me"
    const selects = screen.getAllByRole("combobox");
    expect(selects[0]).toBeDisabled();
    expect(selects[1]).not.toBeDisabled(); // other users are not disabled
  });

  it("role change calls API and updates list", async () => {
    mockUsers.mockResolvedValue(sampleUsers);
    mockUpdateRole.mockResolvedValue({} as never);
    renderUsers();

    await screen.findByText("Mehmet Demir");

    const selects = screen.getAllByRole("combobox");
    // u2 is index 1 (me is 0)
    fireEvent.change(selects[1], { target: { value: "moderator" } });

    await waitFor(() => {
      expect(mockUpdateRole).toHaveBeenCalledWith("u2", "moderator", "test-token");
    });
  });

  it("shows error when role update fails", async () => {
    mockUsers.mockResolvedValue(sampleUsers);
    mockUpdateRole.mockRejectedValue(new Error("Yetki hatası"));
    renderUsers();

    await screen.findByText("Mehmet Demir");
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1], { target: { value: "moderator" } });

    expect(await screen.findByText("Yetki hatası")).toBeInTheDocument();
  });

  it("search input calls API with query", async () => {
    mockUsers.mockResolvedValue(sampleUsers);
    renderUsers();

    await screen.findByText("Admin Me");

    mockUsers.mockResolvedValue([sampleUsers[1]]);
    fireEvent.change(screen.getByPlaceholderText("İsim veya e-posta ara..."), {
      target: { value: "mehmet" },
    });

    await waitFor(() => {
      expect(mockUsers).toHaveBeenCalledWith("test-token", "mehmet");
    });
  });

  it("short search (< 2 chars) fetches without query", async () => {
    mockUsers.mockResolvedValue(sampleUsers);
    renderUsers();

    await screen.findByText("Admin Me");

    fireEvent.change(screen.getByPlaceholderText("İsim veya e-posta ara..."), {
      target: { value: "a" },
    });

    await waitFor(() => {
      expect(mockUsers).toHaveBeenCalledWith("test-token", undefined);
    });
  });

  it("shows empty message when no users found", async () => {
    mockUsers.mockResolvedValue([]);
    renderUsers();

    expect(await screen.findByText("Kullanıcı bulunamadı.")).toBeInTheDocument();
  });

  it("shows error on initial load failure", async () => {
    mockUsers.mockRejectedValue(new Error("Sunucu çöktü"));
    renderUsers();

    expect(await screen.findByText("Sunucu çöktü")).toBeInTheDocument();
  });

  it("renders column headers", async () => {
    mockUsers.mockResolvedValue([]);
    renderUsers();

    await waitFor(() => {
      expect(screen.getByText("Kullanıcı")).toBeInTheDocument();
      expect(screen.getByText("Tür")).toBeInTheDocument();
      expect(screen.getByText("Premium")).toBeInTheDocument();
      expect(screen.getByText("Kayıt")).toBeInTheDocument();
      expect(screen.getByText("Rol")).toBeInTheDocument();
    });
  });

  it("avatar shows first letter of display name", async () => {
    mockUsers.mockResolvedValue([sampleUsers[1]]);
    renderUsers();

    expect(await screen.findByText("M")).toBeInTheDocument(); // Mehmet → M
  });

  it("shows premium checkmark only for premium users", async () => {
    mockUsers.mockResolvedValue(sampleUsers);
    renderUsers();

    await screen.findByText("Admin Me");
    const checkmarks = screen.getAllByText("✅");
    expect(checkmarks).toHaveLength(1); // only Admin Me is premium
  });
});

