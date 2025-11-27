import {
  generateUserRSAKeyPair,
  exportPublicKeyToBase64,
  encryptPrivateKeyWithPassphrase,
  type EncryptedPrivateKeyBundle,
} from "../../../shared/utils/crypto";

export async function performUserKeySetup(passphrase: string) {
  // Step 1: Generate RSA keypair
  const { publicKey, privateKey } = await generateUserRSAKeyPair();

  // Step 2: Convert public key to Base64
  const publicKeyB64 = await exportPublicKeyToBase64(publicKey);

  // Step 3: Encrypt private key with passphrase (AES-GCM)
  const encryptedBundle: EncryptedPrivateKeyBundle =
    await encryptPrivateKeyWithPassphrase(privateKey, passphrase);

  return { publicKeyB64, encryptedBundle };
}
