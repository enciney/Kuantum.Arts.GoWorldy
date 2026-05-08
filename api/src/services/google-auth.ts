import { OAuth2Client } from "google-auth-library";
import { config } from "../config";

let client: OAuth2Client | null = null;

function getClient(): OAuth2Client {
  if (!client) client = new OAuth2Client();
  return client;
}

export function isGoogleConfigured(): boolean {
  return Boolean(
    config.google.webClientId ||
      config.google.iosClientId ||
      config.google.androidClientId
  );
}

export function getAllowedAudiences(): string[] {
  return [
    config.google.webClientId,
    config.google.iosClientId,
    config.google.androidClientId,
  ].filter(Boolean);
}

export interface GoogleVerifiedUser {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleVerifiedUser> {
  const audiences = getAllowedAudiences();
  if (audiences.length === 0) {
    throw new Error("Google OAuth client ID yapılandırılmamış");
  }
  const ticket = await getClient().verifyIdToken({
    idToken,
    audience: audiences,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) throw new Error("Geçersiz Google token");
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}
