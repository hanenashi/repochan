import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function resolveServiceAccountPath() {
  const configured = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (configured) {
    return path.resolve(rootDir, configured);
  }

  return path.resolve(rootDir, "repochan-firebase-adminsdk-fbsvc-c594f5b2b5.json");
}

export function getFirebaseAdmin() {
  if (!getApps().length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
      : JSON.parse(readFileSync(resolveServiceAccountPath(), "utf8"));

    initializeApp({
      credential: cert(serviceAccount)
    });
  }
}

export function getDb() {
  getFirebaseAdmin();
  return getFirestore();
}
