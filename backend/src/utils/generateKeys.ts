import crypto from "crypto";

export interface RSAKeyPair {
  publicKey: string;
  privateKey: string;
}

/**
 * Generate an RSA 2048-bit key pair (for asymmetric encryption).
 */
export function generateRSAKeyPair(): RSAKeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { publicKey, privateKey };
}

/**
 * Encrypt small data (like AES keys) with RSA public key.
 */
export function encryptRSA(publicKey: string, data: string): string {
  const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(data));
  return encrypted.toString("base64");
}

/**
 * Decrypt data (like AES keys) with RSA private key.
 */
export function decryptRSA(privateKey: string, base64Cipher: string): string {
  const decrypted = crypto.privateDecrypt(
    privateKey,
    Buffer.from(base64Cipher, "base64")
  );
  return decrypted.toString("utf8");
}
