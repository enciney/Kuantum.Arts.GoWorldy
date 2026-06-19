import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

// Web client ID: native giris sonrasi backend'in dogruladigi idToken'in audience'i budur.
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";

let configured = false;
function ensureConfigured(): void {
  if (configured) return;
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
  configured = true;
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(WEB_CLIENT_ID);
}

/**
 * Native Google girisi baslatir, backend'e gonderilecek idToken'i doner.
 * Kullanici iptal ederse null doner (hata firlatmaz).
 */
export async function signInWithGoogle(): Promise<string | null> {
  ensureConfigured();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    // @react-native-google-signin v13+: { type, data: { idToken } }
    const idToken =
      (response as { data?: { idToken?: string | null } }).data?.idToken ??
      (response as { idToken?: string | null }).idToken ??
      null;
    if (!idToken) throw new Error("Google idToken alinamadi.");
    return idToken;
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (
      code === statusCodes.SIGN_IN_CANCELLED ||
      code === statusCodes.IN_PROGRESS
    ) {
      return null; // kullanici iptal etti — sessiz gec
    }
    throw e;
  }
}
