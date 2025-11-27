import crypto from "crypto";

/**
 * Generate a SHA-256 hash for data integrity verification.
 */
export function generateIntegrityHash(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Encrypt text using AES-256-GCM.
 * Returns { iv, authTag, ciphertext }.
 */
export function encryptAES256GCM(plaintext: string, key: Buffer) {
  const iv = crypto.randomBytes(12); // 96-bit IV
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

/**
 * Decrypt text using AES-256-GCM.
 */
export function decryptAES256GCM(
  ciphertext: string,
  key: Buffer,
  ivBase64: string,
  authTagBase64: string
): string {
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Generate a random 32-byte AES key.
 */
export function generateAESKey(): Buffer {
  return crypto.randomBytes(32);
}
