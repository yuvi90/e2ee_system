import React from "react";
import { useNavigate } from "react-router-dom";
import { Key, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "../../../shared/utils/helpers";
import { StepCard } from "./StepCard";
import { FormButton } from "../../../shared/components/forms/FormComponents";
import { useRegisterStore } from "../register.store";
import { performUserKeySetup } from "../utils/registration";

export const StepTwo: React.FC = () => {
  const passphrase = useRegisterStore((s) => s.passphrase);
  const setPublicKey = useRegisterStore((s) => s.setPublicKey);
  const setEncryptedPrivateKey = useRegisterStore(
    (s) => s.setEncryptedPrivateKey
  );
  const navigate = useNavigate();
  const [status, setStatus] = React.useState({
    started: false,
    completed: false,
    step1Complete: false,
    step2Complete: false,
    step3Complete: false,
  });
  const [error, setError] = React.useState<string | null>(null);

  const startGeneration = async () => {
    setStatus((prev) => ({ ...prev, started: true }));
    setError(null);

    try {
      // Step 1: Generate RSA Key Pair
      setStatus((prev) => ({ ...prev, step1Complete: false }));
      await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay for UX

      const { publicKeyB64, encryptedBundle } = await performUserKeySetup(
        passphrase
      );
      setStatus((prev) => ({ ...prev, step1Complete: true }));

      // Step 2: Save keys to store
      await new Promise((resolve) => setTimeout(resolve, 800)); // Small delay for UX
      setPublicKey(publicKeyB64);
      setEncryptedPrivateKey(encryptedBundle);
      setStatus((prev) => ({ ...prev, step2Complete: true }));

      // Step 3: Complete
      await new Promise((resolve) => setTimeout(resolve, 800)); // Small delay for UX
      setStatus((prev) => ({ ...prev, step3Complete: true }));

      // Navigate to next step
      setTimeout(() => {
        navigate("/register/step-3");
      }, 1000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Key generation failed";
      console.error("Key generation failed:", err);
      setError(errorMessage);

      // Reset status on error
      setStatus({
        started: false,
        completed: false,
        step1Complete: false,
        step2Complete: false,
        step3Complete: false,
      });
    }
  };

  return (
    <StepCard
      stepNumber={2}
      title="Cryptographic Key Generation"
      description="We'll now generate your unique RSA key pair on your device to secure your files."
      isCompleted={false}
    >
      <div className="space-y-8">
        {error && (
          <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
            {error}
          </div>
        )}

        {!status.started ? (
          <div className="py-4">
            <FormButton
              onClick={startGeneration}
              size="lg"
              className="w-full"
              disabled={!passphrase}
            >
              <Key className="w-5 h-5" />
              Generate My Keys
            </FormButton>
          </div>
        ) : (
          <div className="bg-slate-950/50 rounded-lg border border-slate-800/50 p-6 space-y-6">
            <StatusItem
              completed={status.step1Complete}
              active={status.started && !status.step1Complete}
              text="Generating RSA Key Pair (4096-bit)..."
            />
            <StatusItem
              completed={status.step2Complete}
              active={status.step1Complete && !status.step2Complete}
              text="Encrypting Private Key with Passphrase..."
            />
            <StatusItem
              completed={status.step3Complete}
              active={status.step2Complete && !status.step3Complete}
              text="Keys generated successfully!"
              isLast
            />
          </div>
        )}
      </div>
    </StepCard>
  );
};

const StatusItem: React.FC<{
  completed: boolean;
  active: boolean;
  text: string;
  isLast?: boolean;
}> = ({ completed, active, text, isLast }) => {
  return (
    <div
      className={cn(
        "flex items-center gap-4 transition-all duration-500",
        active || completed ? "opacity-100" : "opacity-30"
      )}
    >
      <div
        className={cn(
          "w-6 h-6 flex items-center justify-center rounded-full transition-all",
          completed
            ? "text-emerald-500 bg-emerald-500/10"
            : active
            ? "text-blue-500"
            : "border-2 border-slate-700"
        )}
      >
        {completed ? (
          <CheckCircle2 className="w-6 h-6" />
        ) : active ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : null}
      </div>
      <span
        className={cn(
          "text-base transition-colors",
          completed && isLast
            ? "text-emerald-400 font-medium"
            : "text-slate-300"
        )}
      >
        {text}
      </span>
    </div>
  );
};
