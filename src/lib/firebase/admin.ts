
import { getApps, getApp, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import serviceAccount from '../../../serviceAccountKey.json';

const BUCKET_NAME = "snapmoment-6xfqd.firebasestorage.app";

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: BUCKET_NAME,
  });
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
export const bucket = getStorage().bucket(BUCKET_NAME);

// Legacy export for simpler refactoring of existing files.
export function getFirebaseAdmin() {
  return {
    db: adminDb,
    adminAuth,
    bucket,
    storage: getStorage(),
    app: getApp(),
  };
}
