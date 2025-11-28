/**
 * Key Manager - Handles activated encryption keys in memory
 * Keys are activated once during login and kept in memory for the session
 */

let activatedPrivateKey: CryptoKey | null = null;
let activatedUserEmail: string | null = null;

export interface KeyActivationResult {
  success: boolean;
  message: string;
}

/**
 * Activate user's encryption keys with passphrase during login
 */
export async function activateUserKeys(
  userEmail: string,
  passphrase: string
): Promise<KeyActivationResult> {
  try {
    console.log("Key Activation: Starting activation for", userEmail);
    console.log("Key Activation: Passphrase provided", !!passphrase);

    const { decryptPrivateKeyWithPassphrase } = await import("./crypto");
    const { getEncryptedPrivateKey } = await import("./indexdb");

    // Get encrypted private key from IndexedDB
    console.log(
      "Key Activation: Retrieving encrypted private key from IndexedDB"
    );
    const encryptedPrivateKeyBundle = await getEncryptedPrivateKey(userEmail);
    if (!encryptedPrivateKeyBundle) {
      console.log(
        "Key Activation: No encrypted private key found in IndexedDB"
      );
      return {
        success: false,
        message:
          "No encryption keys found. Please set up your encryption keys first.",
      };
    }

    console.log(
      "Key Activation: Found encrypted private key, attempting decryption"
    );
    // Decrypt and activate the private key
    const privateKey = await decryptPrivateKeyWithPassphrase(
      encryptedPrivateKeyBundle,
      passphrase
    );

    // Store in memory for the session
    activatedPrivateKey = privateKey;
    activatedUserEmail = userEmail;

    console.log("Encryption keys activated successfully for:", userEmail);
    return {
      success: true,
      message: "Encryption keys activated successfully",
    };
  } catch (error) {
    console.error("Key Activation: Failed to activate encryption keys:", error);
    return {
      success: false,
      message: "Invalid passphrase or corrupted encryption keys",
    };
  }
}

/**
 * Get the activated private key (null if not activated)
 */
export function getActivatedPrivateKey(): CryptoKey | null {
  return activatedPrivateKey;
}

/**
 * Check if keys are activated for the current user
 */
export function areKeysActivated(userEmail: string): boolean {
  return activatedPrivateKey !== null && activatedUserEmail === userEmail;
}

/**
 * Clear activated keys from memory (on logout)
 */
export function clearActivatedKeys(): void {
  activatedPrivateKey = null;
  activatedUserEmail = null;
  console.log("Encryption keys cleared from memory");
}

/**
 * Get the email of the user whose keys are currently activated
 */
export function getActivatedUserEmail(): string | null {
  return activatedUserEmail;
}

/**
 * Check if user has encryption keys set up
 */
export async function hasEncryptionKeys(userEmail: string): Promise<boolean> {
  try {
    const { getEncryptedPrivateKey } = await import("./indexdb");
    const encryptedPrivateKeyBundle = await getEncryptedPrivateKey(userEmail);
    return !!encryptedPrivateKeyBundle;
  } catch (error) {
    return false;
  }
}
