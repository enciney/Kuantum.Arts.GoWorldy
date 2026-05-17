/**
 * Auth flow integration tests
 *
 * Gerçek api.ts → fetch → MSW handler zincirini kullanır.
 * AuthContext ve localStorage etkileşimi de test edilir.
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./setup";
import { AuthProvider } from "../../src/AuthContext";
import LoginPage from "../../src/pages/LoginPage";

// useNavigate mock (sadece navigasyon yönü doğrulamak için)
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("Auth Integration — Login akışı", () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockReset();
  });

  it("geçerli admin kredansiyallarıyla giriş yapılır ve dashboard'a yönlendirilir", async () => {
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "admin123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Giriş Yap" }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    // Token ve kullanıcı localStorage'a yazılmış olmalı
    expect(localStorage.getItem("admin_token")).toBe("fake-jwt-token");
    const storedUser = JSON.parse(localStorage.getItem("admin_user") ?? "{}");
    expect(storedUser.role).toBe("admin");
    expect(storedUser.email).toBe("admin@goworldy.com");
  });

  it("yanlış şifreyle hata mesajı gösterilir", async () => {
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "yanlis_sifre" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Giriş Yap" }));

    expect(await screen.findByText("Geçersiz e-posta veya şifre.")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(localStorage.getItem("admin_token")).toBeNull();
  });

  it("normal kullanıcı rolüyle giriş yapılamaz (erişim reddedilir)", async () => {
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("admin@goworldy.com"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "herhangi_sifre" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Giriş Yap" }));

    expect(
      await screen.findByText("Bu hesabın admin paneline erişim yetkisi yok.")
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
    // Token kaydedilmemiş olmalı
    expect(localStorage.getItem("admin_token")).toBeNull();
  });

  it("sunucu 500 dönünce hata mesajı gösterilir", async () => {
    server.use(
      http.post("http://localhost:3000/api/auth/login", () =>
        HttpResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 })
      )
    );

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "admin123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Giriş Yap" }));

    expect(await screen.findByText("Sunucu hatası oluştu.")).toBeInTheDocument();
  });

  it("giriş sırasında buton disabled ve 'Giriş yapılıyor...' gösterir", async () => {
    // Cevabı askıya al
    server.use(
      http.post("http://localhost:3000/api/auth/login", async () => {
        await new Promise(() => {}); // asla resolve olmaz
        return HttpResponse.json({});
      })
    );

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "admin123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Giriş Yap" }));

    const btn = await screen.findByRole("button", { name: "Giriş yapılıyor..." });
    expect(btn).toBeDisabled();
  });
});
