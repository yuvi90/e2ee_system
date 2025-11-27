import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Copy, Download, ArrowRight } from "lucide-react";

import { useRegisterStore } from "../register.store";
import { saveEncryptedPrivateKey } from "../../../shared/utils/indexdb";
import { authApi } from "../api/authApi";
import { toast } from "../../../shared/utils/toast";
import { StepCard } from "./StepCard";
import { FormButton } from "../../../shared/components/forms/FormComponents";
import type { EncryptedPrivateKeyBundle } from "../../../shared/utils/crypto";

const backupConfirmSchema = z.object({
  confirmBackup: z.boolean().refine((val) => val === true, {
    message: "You must confirm that you have backed up your private key",
  }),
});

type BackupConfirmData = z.infer<typeof backupConfirmSchema>;

export const StepThree: React.FC = () => {
  const { name, email, password, publicKey, encryptedPrivateKeyBundle } =
    useRegisterStore();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<BackupConfirmData>({
    resolver: zodResolver(backupConfirmSchema),
    mode: "onChange",
  });

  // Convert encrypted private key bundle to PEM format for display
  const privateKeyData = encryptedPrivateKeyBundle
    ? convertToPEMFormat(encryptedPrivateKeyBundle)
    : "No private key generated yet";

  // Helper function to convert encrypted bundle to PEM format
  function convertToPEMFormat(bundle: EncryptedPrivateKeyBundle) {
    const base64Data = btoa(JSON.stringify(bundle));
    const pemLines = [];
    pemLines.push("-----BEGIN ENCRYPTED PRIVATE KEY-----");

    // Split base64 into 64-character lines
    for (let i = 0; i < base64Data.length; i += 64) {
      pemLines.push(base64Data.slice(i, i + 64));
    }

    pemLines.push("-----END ENCRYPTED PRIVATE KEY-----");
    return pemLines.join("\n");
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(privateKeyData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!encryptedPrivateKeyBundle) return;

    const jsonData = JSON.stringify(encryptedPrivateKeyBundle, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `private-key-${email}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const onSubmit = async () => {
    if (
      !encryptedPrivateKeyBundle ||
      !email ||
      !name ||
      !password ||
      !publicKey
    ) {
      console.error("Missing required data for account creation");
      return;
    }

    setIsSubmitting(true);
    try {
      // Save encrypted private key to IndexedDB first
      await saveEncryptedPrivateKey(email, encryptedPrivateKeyBundle);

      // Make registration API call
      const response = await authApi.register({
        name,
        email,
        password,
        publicKey,
      });

      console.log("Account created successfully:", response);

      // Store only the access token (refresh token is in httpOnly cookie)
      if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
      }

      // Show success toast
      toast.success(
        `🎉 Welcome to SecureShare, ${name}! Your account has been created successfully.`
      );

      // Clear the registration store
      const { reset } = useRegisterStore.getState();
      reset();

      // Navigate to dashboard with a delay for better UX
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000); // 2 second delay to let user see the success message
    } catch (error) {
      console.error("Failed to create account:", error);

      // Handle specific API errors
      const errorMessage = (
        error as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      if (errorMessage) {
        toast.error(`Registration failed: ${errorMessage}`);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      // Keep button loading during the success delay
      setTimeout(() => {
        setIsSubmitting(false);
      }, 2000);
    }
  };

  return (
    <StepCard
      stepNumber={3}
      title="Backup Your Private Key"
      description="This is critical for account recovery. If you lose this key, you lose your data."
      isCompleted={false}
    >
      <div className="space-y-6">
        {/* Warning Box */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 flex items-start gap-4">
          <div className="p-2 bg-red-500/20 rounded-lg shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h4 className="text-red-500 font-semibold mb-1">
              Store Your Key Safely
            </h4>
            <p className="text-red-400/80 text-sm leading-relaxed">
              We cannot recover your private key. Store it in a secure, offline
              location like a password manager or encrypted USB drive.
            </p>
          </div>
        </div>

        {/* Key Display */}
        <div className="relative group">
          <pre className="bg-black/40 border border-slate-800 rounded-xl p-5 font-mono text-xs text-slate-400 overflow-auto max-h-[200px] min-h-[120px] custom-scrollbar">
            {privateKeyData}
          </pre>
        </div>

        {/* Actions */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-800/50">
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 sm:flex-none px-4 py-2 bg-transparent border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                {copied ? (
                  <span className="text-emerald-400">Copied!</span>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!encryptedPrivateKeyBundle}
                className="flex-1 sm:flex-none px-4 py-2 bg-transparent border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <input
                {...register("confirmBackup")}
                type="checkbox"
                className="mt-1 w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label className="text-sm font-medium text-slate-300 cursor-pointer">
                I have safely backed up my private key and understand that I
                cannot recover my account without it
                <span className="text-red-500 ml-1">*</span>
              </label>
            </div>
            {errors.confirmBackup && (
              <p className="text-sm text-red-500 ml-7">
                {errors.confirmBackup.message}
              </p>
            )}
          </div>

          <FormButton
            type="submit"
            isLoading={isSubmitting}
            disabled={
              isSubmitting ||
              !isValid ||
              !encryptedPrivateKeyBundle ||
              !email ||
              !name ||
              !password ||
              !publicKey
            }
            className="w-full"
          >
            <ArrowRight className="w-4 h-4" />
            {isSubmitting ? "Creating Your Account..." : "Create Account"}
          </FormButton>
        </form>
      </div>
    </StepCard>
  );
};
