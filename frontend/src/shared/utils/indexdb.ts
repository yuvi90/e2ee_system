import { openDB } from "idb";
import type { EncryptedPrivateKeyBundle } from "./crypto";

const DB_NAME = "e2eeFilesDB";
const STORE = "privateKeys";

export async function saveEncryptedPrivateKey(
  userEmail: string,
  bundle: EncryptedPrivateKeyBundle
) {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    },
  });

  await db.put(STORE, bundle, userEmail);
}

export async function getEncryptedPrivateKey(userEmail: string) {
  const db = await openDB(DB_NAME, 1);
  return db.get(STORE, userEmail);
}
