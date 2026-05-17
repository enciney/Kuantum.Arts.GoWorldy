/**
 * Topics (Konu Onay Kuyruğu) integration tests
 *
 * Gerçek api.ts fetch zinciri + MSW kullanılır.
 * EventSource (SSE) mock'lanır çünkü jsdom EventSource desteklemez.
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./setup";
import { AuthProvider } from "../../src/AuthContext";
import TopicsPage from "../../src/pages/TopicsPage";
import { pendingTopics } from "./handlers";

// ── EventSource mock ─────────────────────────────────────────────────────────

class MockEventSource {
  static instance: MockEventSource | null = null;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;

  constructor(public url: string) {
    MockEventSource.instance = this;
  }
  close() {}
  simulateOpen() { this.onopen?.(); }
  simulateMessage(data: object) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderTopics(token = "fake-jwt-token") {
  localStorage.setItem("admin_token", token);
  localStorage.setItem("admin_user", JSON.stringify({ id: "admin-1", role: "admin", email: "admin@goworldy.com", displayName: "Admin" }));
  return render(
    <MemoryRouter>
      <AuthProvider>
        <TopicsPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Topics Integration — Konu Onay Kuyruğu", () => {
  beforeEach(() => {
    localStorage.clear();
    MockEventSource.instance = null;
    // @ts-expect-error mock
    global.EventSource = MockEventSource;
  });

  afterEach(() => {
    // @ts-expect-error cleanup
    delete global.EventSource;
  });

  it("API'dan bekleyen konuları yükler ve tabloda gösterir", async () => {
    renderTopics();

    expect(await screen.findByText("Almanya Vize Süreci Hakkında")).toBeInTheDocument();
    expect(screen.getByText("Hollanda İş İzni Deneyimim")).toBeInTheDocument();
    expect(screen.getByText("Normal Kullanıcı")).toBeInTheDocument();
    expect(screen.getByText("2 bekleyen")).toBeInTheDocument();
  });

  it("boş liste gelince 'Onay bekleyen konu yok' gösterir", async () => {
    server.use(
      http.get("http://localhost:3000/api/admin/forum/pending", () =>
        HttpResponse.json([])
      )
    );

    renderTopics();
    expect(await screen.findByText("Onay bekleyen konu yok")).toBeInTheDocument();
  });

  it("Onayla butonuna tıklanınca API çağrısı yapılır ve konu listeden kalkar", async () => {
    let capturedBody: unknown;
    server.use(
      http.patch("http://localhost:3000/api/forum/topics/:id/status", async ({ request, params }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ok: true, id: params.id, status: "approved" });
      })
    );

    renderTopics();
    const approveBtns = await screen.findAllByRole("button", { name: "Onayla" });
    fireEvent.click(approveBtns[0]);

    await waitFor(() => {
      expect(capturedBody).toEqual({ status: "approved", reason: undefined });
      expect(screen.queryByText("Almanya Vize Süreci Hakkında")).not.toBeInTheDocument();
    });
  });

  it("Reddet → modal → sebep yaz → Reddet: API'ya reason gönderilir ve konu kalkar", async () => {
    let capturedBody: unknown;
    server.use(
      http.patch("http://localhost:3000/api/forum/topics/:id/status", async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ok: true });
      })
    );

    renderTopics();
    await screen.findByText("Almanya Vize Süreci Hakkında");

    const rejectBtns = screen.getAllByRole("button", { name: "Reddet" });
    fireEvent.click(rejectBtns[0]);

    expect(screen.getByText("Reddetme Sebebi")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Örn:/), {
      target: { value: "Kurallara aykırı içerik" },
    });

    const allRejectBtns = screen.getAllByRole("button", { name: "Reddet" });
    fireEvent.click(allRejectBtns[allRejectBtns.length - 1]);

    await waitFor(() => {
      expect(capturedBody).toMatchObject({
        status: "rejected",
        reason: "Kurallara aykırı içerik",
      });
      expect(screen.queryByText("Almanya Vize Süreci Hakkında")).not.toBeInTheDocument();
    });

    expect(screen.queryByText("Reddetme Sebebi")).not.toBeInTheDocument();
  });

  it("modal İptal butonuyla konu listede kalır, API çağrısı yapılmaz", async () => {
    const patchSpy = vi.fn().mockReturnValue(HttpResponse.json({ ok: true }));
    server.use(
      http.patch("http://localhost:3000/api/forum/topics/:id/status", patchSpy)
    );

    renderTopics();
    await screen.findByText("Almanya Vize Süreci Hakkında");

    const rejectBtns = screen.getAllByRole("button", { name: "Reddet" });
    fireEvent.click(rejectBtns[0]);
    fireEvent.click(screen.getByRole("button", { name: "İptal" }));

    expect(screen.queryByText("Reddetme Sebebi")).not.toBeInTheDocument();
    expect(screen.getByText("Almanya Vize Süreci Hakkında")).toBeInTheDocument();
    expect(patchSpy).not.toHaveBeenCalled();
  });

  it("Yenile butonuyla liste yeniden yüklenir", async () => {
    renderTopics();
    await screen.findByText("Almanya Vize Süreci Hakkında");

    // Sonraki istekte farklı veri döndür
    server.use(
      http.get("http://localhost:3000/api/admin/forum/pending", () =>
        HttpResponse.json([pendingTopics[1]])
      )
    );

    fireEvent.click(screen.getByRole("button", { name: "Yenile" }));

    await waitFor(() => {
      expect(screen.queryByText("Almanya Vize Süreci Hakkında")).not.toBeInTheDocument();
      expect(screen.getByText("Hollanda İş İzni Deneyimim")).toBeInTheDocument();
      expect(screen.getByText("1 bekleyen")).toBeInTheDocument();
    });
  });

  it("API hatası durumunda hata mesajı gösterilir", async () => {
    server.use(
      http.get("http://localhost:3000/api/admin/forum/pending", () =>
        HttpResponse.json({ error: "Yetki hatası" }, { status: 403 })
      )
    );

    renderTopics();
    expect(await screen.findByText("Yetki hatası")).toBeInTheDocument();
  });

  it("SSE init mesajıyla liste güncellenir", async () => {
    // İlk REST isteği boş dönsün
    server.use(
      http.get("http://localhost:3000/api/admin/forum/pending", () =>
        HttpResponse.json([])
      )
    );

    renderTopics();
    await screen.findByText("Onay bekleyen konu yok");

    await waitFor(() => expect(MockEventSource.instance).not.toBeNull());
    MockEventSource.instance!.simulateMessage({
      type: "init",
      topics: pendingTopics,
    });

    expect(await screen.findByText("Almanya Vize Süreci Hakkında")).toBeInTheDocument();
    expect(screen.getByText("2 bekleyen")).toBeInTheDocument();
  });

  it("SSE new_pending mesajıyla yeni konu listeye eklenir", async () => {
    server.use(
      http.get("http://localhost:3000/api/admin/forum/pending", () =>
        HttpResponse.json([pendingTopics[0]])
      )
    );

    renderTopics();
    await screen.findByText("Almanya Vize Süreci Hakkında");
    expect(screen.getByText("1 bekleyen")).toBeInTheDocument();

    MockEventSource.instance!.simulateMessage({
      type: "new_pending",
      topic: pendingTopics[1],
    });

    await waitFor(() => {
      expect(screen.getByText("Hollanda İş İzni Deneyimim")).toBeInTheDocument();
      expect(screen.getByText("2 bekleyen")).toBeInTheDocument();
    });
  });
});
