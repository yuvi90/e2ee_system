/**
 * Key Diagnostics Utility
 * Helps diagnose encryption key issues
 */

export async function checkKeyActivationStatus(userEmail: string) {
  const { areKeysActivated, getActivatedPrivateKey } = await import(
    "../shared/utils/keyManager"
  );

  console.log("=== Key Activation Status ===");
  console.log("User email:", userEmail);
  console.log("Keys activated:", areKeysActivated(userEmail));
  console.log("Activated private key exists:", !!getActivatedPrivateKey());

  return {
    activated: areKeysActivated(userEmail),
    hasPrivateKey: !!getActivatedPrivateKey(),
  };
}

export async function debugKeyActivationFailure(userEmail: string) {
  try {
    const { getEncryptedPrivateKey } = await import("../shared/utils/indexdb");

    console.log("=== Debug Key Activation Failure ===");

    // Check if encrypted keys exist
    const encryptedPrivateKey = await getEncryptedPrivateKey(userEmail);
    console.log(
      "Encrypted private key exists in IndexedDB:",
      !!encryptedPrivateKey
    );

    if (encryptedPrivateKey) {
      const keyStructure = {
        hasEncryptedKey: !!encryptedPrivateKey.encryptedPrivateKeyB64,
        hasIv: !!encryptedPrivateKey.ivB64,
        hasSalt: !!encryptedPrivateKey.saltB64,
        keyLength: encryptedPrivateKey.encryptedPrivateKeyB64?.length || 0,
      };
      console.log("Encrypted key bundle structure:", keyStructure);

      // Check if the structure is corrupted
      if (
        !keyStructure.hasEncryptedKey ||
        !keyStructure.hasIv ||
        !keyStructure.hasSalt
      ) {
        console.error(
          "🚨 CRITICAL: Encrypted private key bundle is CORRUPTED!"
        );
        console.log("Raw bundle data:", encryptedPrivateKey);
        console.log(
          "This explains why downloads fail - the private key cannot be decrypted."
        );
        console.log("");
        console.log("🔧 SOLUTIONS:");
        console.log("1. IMMEDIATE: Clear corrupted data and re-setup keys");
        console.log("2. Go through key setup again to generate new keys");
        console.log("3. Note: This will make existing files inaccessible");
        console.log(
          "4. Run: clearCorruptedKeys('" + userEmail + "') in console"
        );

        return "corrupted";
      }
    }

    // Check if the user needs to provide passphrase
    console.log(
      "SOLUTION: User needs to log out and log back in with their encryption passphrase."
    );
    console.log(
      "The login process should activate the keys automatically, but it appears to have failed."
    );

    return !!encryptedPrivateKey;
  } catch (error) {
    console.error("Debug key activation failed:", error);
    return false;
  }
}

export async function clearCorruptedKeys(userEmail: string) {
  try {
    console.log("🔧 Clearing corrupted keys for", userEmail);

    // Clear IndexedDB
    const { openDB } = await import("idb");
    const db = await openDB("e2eeFilesDB", 1);
    await db.delete("privateKeys", userEmail);

    console.log("✅ Corrupted keys cleared from IndexedDB");
    console.log("User should now:");
    console.log("1. Refresh the page");
    console.log("2. Go to registration to generate new keys");
    console.log("3. Note: Existing files will be inaccessible with new keys");

    return true;
  } catch (error) {
    console.error("Failed to clear corrupted keys:", error);
    return false;
  }
}

// Add to browser console for manual testing
(window as any).manualKeyActivation = async function (
  userEmail: string,
  passphrase: string
) {
  try {
    console.log("Attempting manual key activation...");
    const { activateUserKeys } = await import("../shared/utils/keyManager");
    const result = await activateUserKeys(userEmail, passphrase);
    console.log("Manual activation result:", result);
    return result;
  } catch (error) {
    console.error("Manual activation failed:", error);
    return { success: false, message: error.message };
  }
};

// Add to browser console for clearing corrupted keys
(window as any).clearCorruptedKeys = async function (userEmail: string) {
  const { clearCorruptedKeys } = await import("../utils/keyDiagnostics");
  return clearCorruptedKeys(userEmail);
};

export async function diagnoseKeyMismatch(userEmail: string) {
  try {
    const { getEncryptedPrivateKey } = await import("../shared/utils/indexdb");
    const { areKeysActivated, getActivatedPrivateKey } = await import(
      "../shared/utils/keyManager"
    );

    console.log("=== Encryption Key Diagnostics ===");
    console.log("User email:", userEmail);

    // Check if keys are activated
    const keysActivated = areKeysActivated(userEmail);
    console.log("Keys activated in memory:", keysActivated);

    // Check stored keys
    const encryptedPrivateKey = await getEncryptedPrivateKey(userEmail);
    console.log("Encrypted private key exists:", !!encryptedPrivateKey);

    if (keysActivated) {
      const activatedPrivateKey = getActivatedPrivateKey();
      if (activatedPrivateKey) {
        console.log("Activated private key details:", {
          algorithm: activatedPrivateKey.algorithm,
          type: activatedPrivateKey.type,
          extractable: activatedPrivateKey.extractable,
          usages: activatedPrivateKey.usages,
        });
      }
    }

    return {
      keysActivated,
      hasEncryptedPrivateKey: !!encryptedPrivateKey,
    };
  } catch (error) {
    console.error("Key diagnostics failed:", error);
    return null;
  }
}

export async function checkKeyMismatchIssue(
  userEmail: string,
  encryptedKey: string
) {
  try {
    console.log("=== Key Mismatch Analysis ===");
    console.log(
      "This file cannot be decrypted with your current encryption keys."
    );
    console.log("Possible reasons:");
    console.log(
      "1. File was uploaded on a different device with different keys"
    );
    console.log(
      "2. Your encryption keys were regenerated after this file was uploaded"
    );
    console.log(
      "3. File was shared with you using old keys that no longer work"
    );
    console.log("");
    console.log("Encrypted key info:");
    console.log("- Length:", encryptedKey.length);
    console.log("- First 50 chars:", encryptedKey.substring(0, 50) + "...");
    console.log("");
    console.log("Solutions:");
    console.log("1. If this is your file: Re-upload it with your current keys");
    console.log("2. If this is a shared file: Ask the owner to re-share it");
    console.log("3. If many files have this issue: Consider key regeneration");

    return false;
  } catch (error) {
    console.error("Key mismatch analysis failed:", error);
    return false;
  }
}
