import * as admin from "firebase-admin";
import { config } from "../config";

let initialized = false;

export function isFirebaseConfigured(): boolean {
  return Boolean(
    config.firebase.projectId &&
      config.firebase.clientEmail &&
      config.firebase.privateKey
  );
}

export function getFirebaseAdmin(): typeof admin | null {
  if (!isFirebaseConfigured()) return null;
  if (!initialized) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
    });
    initialized = true;
  }
  return admin;
}

export interface GoogleVerifiedUser {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleVerifiedUser> {
  const a = getFirebaseAdmin();
  if (!a) throw new Error("Firebase yapılandırılmamış");
  const decoded = await a.auth().verifyIdToken(idToken);
  if (!decoded.email) throw new Error("Email claim yok");
  return {
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name,
    picture: decoded.picture,
  };
}
