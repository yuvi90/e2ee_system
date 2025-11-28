import React, { useState } from "react";
import { X, Share2, User, Lock, CheckCircle, Key } from "lucide-react";
import { Button } from "../../../shared/components";
import { FileAPI } from "../api/fileApi";
import {
  unwrapFileAESKeyWithRSA,
  wrapFileAESKeyWithRSA,
  importPublicKeyFromBase64,
  bufferToBase64,
} from "../../../shared/utils/crypto";
import { useAuth } from "../../../shared/hooks/useAuth";
import { toast } from "../../../shared/utils/toast";
import { authApi } from "../../auth/api/authApi";
import { useEffect, useCallback } from "react";

interface ShareFileModalProps {
  fileId: string;
  filename: string;
  encryptedKeyForOwner: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ShareFileModal: React.FC<ShareFileModalProps> = ({
  fileId,
  filename,
  encryptedKeyForOwner,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailValidation, setEmailValidation] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [step, setStep] = useState<"email" | "success" | "key-mismatch">(
    "email"
  );
  const [sharedWith, setSharedWith] = useState("");

  // Debounced email validation
  const validateEmail = useCallback(
    async (email: string) => {
      if (!email || !email.includes("@")) {
        setEmailValidation(null);
        return;
      }

      if (email === user?.email) {
        setEmailValidation({
          valid: false,
          message: "Cannot share file with yourself",
        });
        return;
      }

      setIsCheckingEmail(true);
      try {
        const result = await authApi.checkUserExists(email);
        if (result.exists) {
          if (result.hasKeys) {
            setEmailValidation({
              valid: true,
              message: "User found and ready to receive files",
            });
          } else {
            setEmailValidation({
              valid: false,
              message: "User exists but hasn't set up encryption keys",
            });
          }
        } else {
          setEmailValidation({
            valid: false,
            message: "User not found. They need to register first.",
          });
        }
      } catch {
        setEmailValidation({
          valid: false,
          message: "Failed to validate user",
        });
      } finally {
        setIsCheckingEmail(false);
      }
    },
    [user?.email]
  );

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      validateEmail(recipientEmail);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [recipientEmail, validateEmail]);

  const handleShare = async () => {
    if (!user?.email) {
      toast.error("User not authenticated");
      return;
    }

    if (!encryptedKeyForOwner) {
      toast.error("Missing encryption data for this file");
      return;
    }

    // Check if encryption keys are activated
    const { areKeysActivated, getActivatedPrivateKey } = await import(
      "../../../shared/utils/keyManager"
    );
    if (!areKeysActivated(user.email)) {
      toast.error(
        "Encryption keys not activated. Please log out and log back in with your passphrase."
      );
      return;
    }

    const userPrivateKey = getActivatedPrivateKey();
    if (!userPrivateKey) {
      toast.error(
        "No activated encryption keys found. Please log out and log back in."
      );
      return;
    }

    setIsSharing(true);
    console.log("Starting share process...", {
      recipientEmail,
      hasEncryptedKey: !!encryptedKeyForOwner,
      userEmail: user.email,
      fileId,
      filename,
    });

    try {
      // Step 1: Get recipient's public key from server
      const recipientData = await authApi.getUserPublicKey(recipientEmail);
      if (!recipientData.success) {
        throw new Error("Failed to get recipient's public key");
      }

      // Step 2: Keys are already activated, use them directly
      console.log("Using activated encryption keys for sharing");

      // Step 3: Validate and unwrap the file's AES key using user's private key
      if (!encryptedKeyForOwner || typeof encryptedKeyForOwner !== "string") {
        throw new Error("Invalid encrypted key format");
      }

      console.log("Unwrapping file AES key...", {
        encryptedKeyForOwner: encryptedKeyForOwner.substring(0, 50) + "...",
        keyType: typeof encryptedKeyForOwner,
        keyLength: encryptedKeyForOwner.length,
      });

      let fileAESKey;
      try {
        fileAESKey = await unwrapFileAESKeyWithRSA(
          encryptedKeyForOwner,
          userPrivateKey
        );
        console.log("File AES key unwrapped successfully");
      } catch (unwrapError) {
        console.error("AES key unwrapping failed:", unwrapError);
        console.log("Private key details:", {
          algorithm: userPrivateKey.algorithm,
          extractable: userPrivateKey.extractable,
          type: userPrivateKey.type,
          usages: userPrivateKey.usages,
        });
        const keyMismatchError = new Error(
          "Cannot decrypt this file's encryption key. This usually means your encryption keys have changed since the file was uploaded. This can happen if you're using a different device or if your keys were reset. You may need to re-upload this file with your current encryption keys."
        );
        (keyMismatchError as any).isKeyMismatch = true;
        throw keyMismatchError;
      }

      // Step 5: Validate and import recipient's public key
      if (
        !recipientData.data.publicKey ||
        typeof recipientData.data.publicKey !== "string"
      ) {
        throw new Error("Invalid recipient public key format");
      }

      console.log("Importing recipient's public key...", {
        publicKey: recipientData.data.publicKey.substring(0, 50) + "...",
        keyLength: recipientData.data.publicKey.length,
      });

      const recipientPublicKey = await importPublicKeyFromBase64(
        recipientData.data.publicKey
      );
      console.log("Recipient public key imported successfully");

      // Step 6: Re-wrap AES key for recipient (CLIENT-SIDE)
      console.log("Re-wrapping AES key for recipient...");
      const wrappedKeyForRecipient = await wrapFileAESKeyWithRSA(
        fileAESKey,
        recipientPublicKey
      );
      console.log("AES key re-wrapped successfully");

      // Step 7: Share the file with pre-wrapped key
      const response = await FileAPI.shareFile(
        fileId,
        recipientEmail,
        wrappedKeyForRecipient // Already wrapped for recipient
      );

      // Step 8: Clear sensitive data from memory
      if (fileAESKey instanceof Uint8Array) {
        fileAESKey.fill(0);
      }

      if (response.success) {
        setSharedWith(recipientEmail);
        setStep("success");
        toast.success(`File shared successfully with ${recipientEmail}`);
        onSuccess?.();
      }
    } catch (error) {
      console.error("Share error:", error);

      let message = "Failed to share file";

      if (error instanceof DOMException) {
        if (error.message.includes("operation failed")) {
          message =
            "Invalid passphrase. Please check your passphrase and try again.";
        } else {
          message = `Cryptographic operation failed: ${error.message}`;
        }
      } else if (error instanceof Error) {
        if ((error as any).isKeyMismatch) {
          // Handle key mismatch - show special UI instead of just error
          setStep("key-mismatch");
          return;
        } else if (error.message.includes("No private key found")) {
          message =
            "No encryption keys found. Please ensure your keys are set up properly.";
        } else if (error.message.includes("Failed to get recipient")) {
          message = "Could not retrieve recipient's encryption keys.";
        } else {
          message = error.message;
        }
      }

      toast.error(message);

      if (
        message.includes("passphrase") ||
        message.includes("decrypt") ||
        message.includes("Invalid passphrase")
      ) {
        // Stay on passphrase step if decryption failed
        return;
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleEmailNext = () => {
    if (!emailValidation?.valid) {
      toast.error(
        emailValidation?.message || "Please enter a valid recipient email"
      );
      return;
    }
    // Directly proceed to share since keys are already activated
    handleShare();
  };

  const handleClose = () => {
    setRecipientEmail("");
    setStep("email");
    setSharedWith("");
    setEmailValidation(null);
    setIsCheckingEmail(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Share2 className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Share File</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-slate-400 mb-2">Sharing:</p>
          <p className="text-white font-medium">{filename}.enc</p>
        </div>

        {step === "email" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Recipient Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-400 focus:outline-none ${
                    emailValidation?.valid === false
                      ? "border-red-500 focus:border-red-400"
                      : emailValidation?.valid === true
                      ? "border-green-500 focus:border-green-400"
                      : "border-slate-600 focus:border-blue-400"
                  }`}
                  placeholder="Enter recipient's email"
                  autoFocus
                />
                {isCheckingEmail && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              {emailValidation && (
                <p
                  className={`text-xs mt-2 ${
                    emailValidation.valid ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {emailValidation.message}
                </p>
              )}
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-300 font-medium mb-1">
                    End-to-End Encrypted Sharing
                  </p>
                  <p className="text-xs text-slate-400">
                    The file will be encrypted with the recipient's public key.
                    Only they can decrypt and access it.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleClose}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleEmailNext} className="flex-1">
                Next
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                File Shared Successfully!
              </h3>
              <p className="text-sm text-slate-400">
                {filename}.enc has been securely shared with{" "}
                <span className="text-white font-medium">{sharedWith}</span>
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}

        {step === "key-mismatch" && (
          <div className="space-y-6">
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <Key className="w-12 h-12 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Encryption Key Mismatch
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  This file was encrypted with different encryption keys than
                  the ones you're currently using. This commonly happens when
                  using a different device or after clearing browser data.
                </p>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-2">
                Solutions:
              </h4>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>
                  • Re-upload this file to encrypt it with your current keys
                </li>
                <li>
                  • Use the same device/browser where you originally uploaded it
                </li>
                <li>
                  • Check if you have the original encryption keys backed up
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setStep("email");
                  setRecipientEmail("");
                }}
                className="flex-1"
              >
                Try Again
              </Button>
              <Button onClick={onClose} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
