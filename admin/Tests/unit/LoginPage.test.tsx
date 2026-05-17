import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../../src/pages/LoginPage";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../../src/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin, token: null, user: null, logout: vi.fn() }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../src/api", () => ({
  api: {
    auth: {
      login: vi.fn(),
    },
  },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

import { api } from "../../src/api";
const mockApiLogin = vi.mocked(api.auth.login);

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form with email pre-filled", () => {
    renderLogin();

    expect(screen.getByText("GoWorldy Admin")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("admin@goworldy.com")).toHaveValue(
      "admin@goworldy.com"
    );
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Giriş Yap" })).toBeInTheDocument();
  });

  it("shows loading state while submitting", async () => {
    mockApiLogin.mockReturnValue(new Promise(() => {})); // never resolves

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "pass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Giriş Yap" }));

    expect(
      await screen.findByRole("button", { name: "Giriş yapılıyor..." })
    ).toBeDisabled();
  });

  it("calls login and navigates on successful admin login", async () => {
    const fakeUser = { id: "1", email: "admin@goworldy.com", displayName: "Admin", role: "admin" as const };
    mockApiLogin.mockResolvedValue({ token: "tok123", user: fakeUser });

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Giriş Yap" }));

    await waitFor(() => {
      expect(mockApiLogin).toHaveBeenCalledWith("admin@goworldy.com", "secret");
      expect(mockLogin).toHaveBeenCalledWith("tok123", fakeUser);
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("shows error when role is not admin or moderator", async () => {
    const regularUser = { id: "2", email: "user@test.com", displayName: "User", role: "user" as const };
    mockApiLogin.mockResolvedValue({ token: "tok", user: regularUser });

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Giriş Yap" }));

    expect(
      await screen.findByText("Bu hesabın admin paneline erişim yetkisi yok.")
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows error message on API failure", async () => {
    mockApiLogin.mockRejectedValue(new Error("Geçersiz şifre."));

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Giriş Yap" }));

    expect(await screen.findByText("Geçersiz şifre.")).toBeInTheDocument();
  });

  it("shows generic error for non-Error rejections", async () => {
    mockApiLogin.mockRejectedValue("network failure");

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Giriş Yap" }));

    expect(await screen.findByText("Giriş başarısız.")).toBeInTheDocument();
  });

  it("moderator role is allowed to login", async () => {
    const mod = { id: "3", email: "mod@test.com", displayName: "Mod", role: "moderator" as const };
    mockApiLogin.mockResolvedValue({ token: "tok_mod", user: mod });

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Giriş Yap" }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("tok_mod", mod);
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("allows changing email value", () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText("admin@goworldy.com");
    fireEvent.change(emailInput, { target: { value: "other@test.com" } });
    expect(emailInput).toHaveValue("other@test.com");
  });
});

