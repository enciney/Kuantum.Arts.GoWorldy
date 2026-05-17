process.env.EXPO_PUBLIC_API_URL = "http://localhost:3000/api";

export function mockOk(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

export function mockErr(body: unknown, status: number): Response {
  return {
    ok: false,
    status,
    json: async () => body,
  } as unknown as Response;
}
