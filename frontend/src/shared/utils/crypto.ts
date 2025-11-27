/**
 * Utility functions for E2EE:
 * - User RSA keypair generation
 * - Private key protection (AES + PBKDF2)
 * - File encryption/decryption (AES-GCM)
 * - AES key wrapping/unwrapping with RSA-OAEP
 */

export type EncryptedPrivateKeyBundle = {
  encryptedPrivateKeyB64: string;
  ivB64: string;
  saltB64: string;
};

export type DerivedKeyResult = {
  key: CryptoKey; // AES-GCM key
  salt: Uint8Array; // random salt for PBKDF2
};

export type EncryptedFileResult = {
  encryptedFile: File; // .enc binary file
  encryptedFileKeyB64: string; // AES key B wrapped with owner's public key
  integrityHashHex: string; // SHA-256(ciphertext)
  ivB64: string; // IV used for AES-GCM
};

/**
 * Helper: convert ArrayBuffer -> base64 string
 */
export function bufferToBase64(buf: ArrayBufferLike): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Helper: convert base64 string -> ArrayBuffer
 */
export function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Helper: convert ArrayBuffer to hex string (for SHA-256 hash display)
 */
export function bufferToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * 1. Generate RSA keypair for the user (for file sharing)
 * Uses RSA-OAEP with SHA-256 — good for wrapping AES keys.
 */
export async function generateUserRSAKeyPair(): Promise<{
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  };
}

/**
 * 2. Export public key to a base64 string (SPKI format),
 * optionally to be wrapped as PEM or sent to backend.
 */
export async function exportPublicKeyToBase64(
  publicKey: CryptoKey
): Promise<string> {
  const spki = await crypto.subtle.exportKey("spki", publicKey);
  return bufferToBase64(spki);
}

/**
 * 3. Export private key to raw PKCS8 bytes (ArrayBuffer),
 * so we can encrypt it with an AES key derived from passphrase.
 */
export async function exportPrivateKeyToPkcs8(
  privateKey: CryptoKey
): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey("pkcs8", privateKey);
}

/**
 * 4. Derive AES key from user passphrase using PBKDF2.
 * This AES key (Key A) is ONLY for encrypting the RSA private key.
 *
 * If salt is not provided, we generate a new random 16-byte salt.
 */
export async function deriveAESKeyFromPassphrase(
  passphrase: string,
  salt?: Uint8Array
): Promise<DerivedKeyResult> {
  const enc = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const usedSalt = salt ?? crypto.getRandomValues(new Uint8Array(16));

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: usedSalt as unknown as BufferSource,
      iterations: 250_000,
      hash: "SHA-256",
    },
    passphraseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  return { key: aesKey, salt: usedSalt };
}

/**
 * 5. Encrypt the user's RSA private key with AES-GCM (using Key A).
 * Result is meant to be stored locally (IndexedDB/localStorage),
 * NEVER sent to the server.
 */
export async function encryptPrivateKeyWithPassphrase(
  privateKey: CryptoKey,
  passphrase: string
): Promise<EncryptedPrivateKeyBundle> {
  // Export private key → raw PKCS8 bytes
  const pkcs8 = await exportPrivateKeyToPkcs8(privateKey);

  // Derive AES key from passphrase
  const { key: aesKey, salt } = await deriveAESKeyFromPassphrase(passphrase);

  // Generate IV for AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt private key bytes
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    pkcs8
  );

  return {
    encryptedPrivateKeyB64: bufferToBase64(encrypted),
    ivB64: bufferToBase64(iv.buffer),
    saltB64: bufferToBase64(salt.buffer),
  };
}

/**
 * 6. Decrypt the user's encrypted private key using passphrase.
 * Used during login or when unlocking crypto operations.
 */
export async function decryptPrivateKeyWithPassphrase(
  bundle: EncryptedPrivateKeyBundle,
  passphrase: string
): Promise<CryptoKey> {
  const encryptedBuf = base64ToBuffer(bundle.encryptedPrivateKeyB64);
  const iv = new Uint8Array(base64ToBuffer(bundle.ivB64));
  const salt = new Uint8Array(base64ToBuffer(bundle.saltB64));

  // Derive AES key from passphrase & stored salt
  const { key: aesKey } = await deriveAESKeyFromPassphrase(passphrase, salt);

  // Decrypt PKCS8 private key bytes
  const pkcs8 = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encryptedBuf
  );

  // Import back as CryptoKey
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );

  return privateKey;
}

/**
 * 7. Generate a random AES key (Key B) for a single file.
 * This key is used to encrypt the file contents.
 */
export async function generateFileAESKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * 8. Encrypt a File object using AES-GCM (Key B).
 * Returns ciphertext bytes + IV, which are then saved as .enc file.
 */
export async function encryptFileWithAESKey(
  file: File,
  aesKey: CryptoKey
): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
  const fileBytes = await file.arrayBuffer();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    fileBytes
  );

  return { ciphertext, iv };
}

/**
 * 9. Wrap (encrypt) the file AES key using an RSA public key (owner or recipient).
 * This is how we create encryptedKeyForOwner / encryptedKeyForRecipient.
 */
export async function wrapFileAESKeyWithRSA(
  aesKey: CryptoKey,
  rsaPublicKey: CryptoKey
): Promise<string> {
  // Export AES key as raw bytes first
  const rawAes = await crypto.subtle.exportKey("raw", aesKey);

  const encrypted = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    rsaPublicKey,
    rawAes
  );

  return bufferToBase64(encrypted);
}

/**
 * 10. Unwrap (decrypt) the file AES key using RSA private key.
 * This is used when owner/recipient wants to decrypt the file.
 */
export async function unwrapFileAESKeyWithRSA(
  encryptedKeyB64: string,
  rsaPrivateKey: CryptoKey
): Promise<CryptoKey> {
  const encryptedBuf = base64ToBuffer(encryptedKeyB64);

  const rawAes = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    rsaPrivateKey,
    encryptedBuf
  );

  // Import as AES-GCM key
  return crypto.subtle.importKey("raw", rawAes, { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * 11. Compute SHA-256 hash of ciphertext (for integrity).
 */
export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(hashBuf);
}

/**
 * 12. High-level helper to do full E2EE file encryption
 * for upload (owner flow):
 *
 * - generate AES key (Key B)
 * - encrypt file with AES-GCM
 * - hash ciphertext
 * - wrap AES key with owner's public RSA key
 * - return .enc File + metadata
 */
export async function encryptFileForOwnerUpload(params: {
  file: File;
  ownerPublicKey: CryptoKey;
}): Promise<EncryptedFileResult> {
  const { file, ownerPublicKey } = params;

  // 1. Random AES key per file
  const fileAESKey = await generateFileAESKey();

  // 2. Encrypt file bytes
  const { ciphertext, iv } = await encryptFileWithAESKey(file, fileAESKey);

  // 3. Compute integrity hash of ciphertext
  const integrityHashHex = await sha256Hex(ciphertext);

  // 4. Wrap AES key with owner's RSA public key
  const encryptedFileKeyB64 = await wrapFileAESKeyWithRSA(
    fileAESKey,
    ownerPublicKey
  );

  // 5. Build .enc File object to send via multipart/form-data
  const encryptedBlob = new Blob([ciphertext], {
    type: "application/octet-stream",
  });

  const encryptedFile = new File([encryptedBlob], file.name + ".enc", {
    type: "application/octet-stream",
  });

  return {
    encryptedFile,
    encryptedFileKeyB64,
    integrityHashHex,
    ivB64: bufferToBase64(iv.buffer),
  };
}

/**
 * 13. Decrypt encrypted file downloaded from server:
 * - unwrap AES key (Key B) using RSA private key
 * - decrypt ciphertext with AES-GCM
 * - return original file bytes (caller can turn into Blob/File)
 */
export async function decryptDownloadedFile(params: {
  encryptedFileBytes: ArrayBuffer;
  ivB64: string;
  encryptedFileKeyB64: string;
  rsaPrivateKey: CryptoKey;
}): Promise<ArrayBuffer> {
  const { encryptedFileBytes, ivB64, encryptedFileKeyB64, rsaPrivateKey } =
    params;

  // 1. Recover AES key B via RSA-OAEP (using user private key)
  const fileAESKey = await unwrapFileAESKeyWithRSA(
    encryptedFileKeyB64,
    rsaPrivateKey
  );

  // 2. Parse IV
  const iv = new Uint8Array(base64ToBuffer(ivB64));

  // 3. Decrypt file ciphertext
  const plaintextBytes = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    fileAESKey,
    encryptedFileBytes
  );

  return plaintextBytes;
}
