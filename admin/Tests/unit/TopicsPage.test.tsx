import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import TopicsPage from "../../src/pages/TopicsPage";
import type { Topic } from "../../src/api";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../../src/AuthContext", () => ({
  useAuth: () => ({ token: "test-token", user: null, login: vi.fn(), logout: vi.fn() }),
}));

vi.mock("../../src/api", () => ({
  api: {
    admin: {
      pendingTopics: vi.fn(),
    },
    forum: {
      updateTopicStatus: vi.fn(),
      getEditRequests: vi.fn().mockResolvedValue([]),
      getDeletionRequests: vi.fn().mockResolvedValue([]),
    },
  },
}));

import { api } from "../../src/api";
const mockPendingTopics = vi.mocked(api.admin.pendingTopics);
const mockUpdateTopicStatus = vi.mocked(api.forum.updateTopicStatus);

// EventSource mock
class MockEventSource {
  static instance: MockEventSource | null = null;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  closed = false;

  constructor(public url: string) {
    MockEventSource.instance = this;
  }

  close() {
    this.closed = true;
  }

  simulateOpen() {
    this.onopen?.();
  }

  simulateMessage(data: object) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simulateError() {
    this.onerror?.();
  }
}

const sampleTopics: Topic[] = [
  {
    id: "t1",
    title: "Almanya Vize Süreci",
    status: "pending",
    authorId: "u1",
    authorDisplayName: "Ahmet Yılmaz",
    categoryId: "c1",
    categoryName: "Vize",
    countryName: "Almanya",
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "t2",
    title: "Hollanda Çalışma İzni",
    status: "pending",
    authorId: "u2",
    authorDisplayName: "Fatma Kaya",
    categoryId: "c2",
    categoryName: "İş",
    countryName: "Hollanda",
    createdAt: "2024-01-16T11:00:00Z",
  },
];

function renderTopics() {
  return render(
    <MemoryRouter>
      <TopicsPage />
    </MemoryRouter>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("TopicsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockEventSource.instance = null;
    // @ts-expect-error mock
    global.EventSource = MockEventSource;
  });

  afterEach(() => {
    // @ts-expect-error cleanup
    delete global.EventSource;
  });

  it("renders page heading", () => {
    mockPendingTopics.mockResolvedValue([]);
    renderTopics();
    expect(screen.getByText("Forum Moderasyonu")).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    mockPendingTopics.mockReturnValue(new Promise(() => {}));
    renderTopics();
    expect(screen.getByText("Yükleniyor...")).toBeInTheDocument();
  });

  it("shows empty state when no pending topics", async () => {
    mockPendingTopics.mockResolvedValue([]);
    renderTopics();

    expect(await screen.findByText("Onay bekleyen konu yok")).toBeInTheDocument();
    expect(screen.getByText("Bekleyen Konular")).toBeInTheDocument();
  });

  it("renders topics table with data", async () => {
    mockPendingTopics.mockResolvedValue(sampleTopics);
    renderTopics();

    expect(await screen.findByText("Almanya Vize Süreci")).toBeInTheDocument();
    expect(screen.getByText("Hollanda Çalışma İzni")).toBeInTheDocument();
    expect(screen.getByText("Ahmet Yılmaz")).toBeInTheDocument();
    expect(screen.getByText("Fatma Kaya")).toBeInTheDocument();
    expect(screen.getByText("Almanya")).toBeInTheDocument();
    expect(screen.getByText("Bekleyen Konular (2)")).toBeInTheDocument();
  });

  it("approving a topic removes it from list", async () => {
    mockPendingTopics.mockResolvedValue(sampleTopics);
    mockUpdateTopicStatus.mockResolvedValue({} as never);
    renderTopics();

    const approveBtns = await screen.findAllByRole("button", { name: "Onayla" });
    fireEvent.click(approveBtns[0]);

    await waitFor(() => {
      expect(mockUpdateTopicStatus).toHaveBeenCalledWith("t1", "approved", "test-token", undefined);
      expect(screen.queryByText("Almanya Vize Süreci")).not.toBeInTheDocument();
    });
  });

  it("reject button opens modal", async () => {
    mockPendingTopics.mockResolvedValue(sampleTopics);
    renderTopics();

    const rejectBtns = await screen.findAllByRole("button", { name: "Reddet" });
    fireEvent.click(rejectBtns[0]);

    expect(screen.getByText("Konuyu Reddet")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Sebep girin...")).toBeInTheDocument();
  });

  it("modal cancel closes without action", async () => {
    mockPendingTopics.mockResolvedValue(sampleTopics);
    renderTopics();

    const rejectBtns = await screen.findAllByRole("button", { name: "Reddet" });
    fireEvent.click(rejectBtns[0]);

    fireEvent.click(screen.getByRole("button", { name: "İptal" }));

    expect(screen.queryByText("Konuyu Reddet")).not.toBeInTheDocument();
    expect(mockUpdateTopicStatus).not.toHaveBeenCalled();
  });

  it("modal confirm rejects topic with reason", async () => {
    mockPendingTopics.mockResolvedValue(sampleTopics);
    mockUpdateTopicStatus.mockResolvedValue({} as never);
    renderTopics();

    const rejectBtns = await screen.findAllByRole("button", { name: "Reddet" });
    fireEvent.click(rejectBtns[0]);

    fireEvent.change(screen.getByPlaceholderText("Sebep girin..."), {
      target: { value: "Kurallara aykırı" },
    });
    // Modal has multiple Reddet buttons (table rows + modal confirm) — use the last one (modal)
    const allRejectBtns = screen.getAllByRole("button", { name: "Reddet" });
    fireEvent.click(allRejectBtns[allRejectBtns.length - 1]);

    await waitFor(() => {
      expect(mockUpdateTopicStatus).toHaveBeenCalledWith(
        "t1",
        "rejected",
        "test-token",
        "Kurallara aykırı"
      );
    });
    expect(screen.queryByText("Konuyu Reddet")).not.toBeInTheDocument();
  });

  it("modal confirm can reject without a reason", async () => {
    mockPendingTopics.mockResolvedValue(sampleTopics);
    mockUpdateTopicStatus.mockResolvedValue({} as never);
    renderTopics();

    const rejectBtns = await screen.findAllByRole("button", { name: "Reddet" });
    fireEvent.click(rejectBtns[0]);
    // leave reason empty — click modal confirm (last Reddet button)
    const allRejectBtns = screen.getAllByRole("button", { name: "Reddet" });
    fireEvent.click(allRejectBtns[allRejectBtns.length - 1]);

    await waitFor(() => {
      expect(mockUpdateTopicStatus).toHaveBeenCalledWith(
        "t1",
        "rejected",
        "test-token",
        undefined
      );
    });
  });

  it("shows error when API fails", async () => {
    mockPendingTopics.mockRejectedValue(new Error("Bağlantı hatası"));
    renderTopics();

    expect(await screen.findByText("Bağlantı hatası")).toBeInTheDocument();
  });

  it("SSE connection is created with token", async () => {
    mockPendingTopics.mockResolvedValue([]);
    renderTopics();

    await waitFor(() => {
      expect(MockEventSource.instance).not.toBeNull();
      expect(MockEventSource.instance!.url).toContain("test-token");
    });
  });

  it("shows Live status when SSE opens", async () => {
    mockPendingTopics.mockResolvedValue([]);
    renderTopics();

    await waitFor(() => expect(MockEventSource.instance).not.toBeNull());
    MockEventSource.instance!.simulateOpen();

    expect(await screen.findByText("● Canlı")).toBeInTheDocument();
  });

  it("shows Offline status when SSE errors", async () => {
    mockPendingTopics.mockResolvedValue([]);
    renderTopics();

    await waitFor(() => expect(MockEventSource.instance).not.toBeNull());
    MockEventSource.instance!.simulateError();

    expect(await screen.findByText("✕ Çevrimdışı")).toBeInTheDocument();
  });

  it("SSE init message populates topics", async () => {
    mockPendingTopics.mockResolvedValue([]);
    renderTopics();

    await waitFor(() => expect(MockEventSource.instance).not.toBeNull());
    MockEventSource.instance!.simulateMessage({
      type: "init",
      topics: sampleTopics,
    });

    expect(await screen.findByText("Almanya Vize Süreci")).toBeInTheDocument();
  });

  it("SSE new_pending adds topic to list", async () => {
    mockPendingTopics.mockResolvedValue([]);
    renderTopics();

    await waitFor(() => expect(MockEventSource.instance).not.toBeNull());
    MockEventSource.instance!.simulateMessage({
      type: "new_pending",
      topic: sampleTopics[0],
    });

    expect(await screen.findByText("Almanya Vize Süreci")).toBeInTheDocument();
  });

  it("SSE removed message removes topic from list", async () => {
    mockPendingTopics.mockResolvedValue(sampleTopics);
    renderTopics();

    await screen.findByText("Almanya Vize Süreci");

    MockEventSource.instance!.simulateMessage({
      type: "removed",
      topicId: "t1",
    });

    await waitFor(() => {
      expect(screen.queryByText("Almanya Vize Süreci")).not.toBeInTheDocument();
    });
  });

  it("Yenile button reloads topics", async () => {
    mockPendingTopics.mockResolvedValue([]);
    renderTopics();

    await screen.findByText("Onay bekleyen konu yok");

    mockPendingTopics.mockResolvedValue(sampleTopics);
    fireEvent.click(screen.getByRole("button", { name: "Yenile" }));

    expect(await screen.findByText("Almanya Vize Süreci")).toBeInTheDocument();
  });
});

