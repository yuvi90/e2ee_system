import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EncryptedPrivateKeyBundle } from "../../shared/utils/crypto";

interface RegisterState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  passphrase: string;

  publicKey: string | null;
  encryptedPrivateKeyBundle: EncryptedPrivateKeyBundle | null;

  setField: (field: string, value: string) => void;
  setPublicKey: (key: string) => void;
  setEncryptedPrivateKey: (bundle: EncryptedPrivateKeyBundle) => void;
  reset: () => void;
}

export const useRegisterStore = create<RegisterState>()(
  persist(
    (set) => ({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      passphrase: "",
      publicKey: null,
      encryptedPrivateKeyBundle: null,

      setField: (field, value) =>
        set((state) => ({ ...state, [field]: value })),
      setPublicKey: (key) => set({ publicKey: key }),
      setEncryptedPrivateKey: (bundle) =>
        set({ encryptedPrivateKeyBundle: bundle }),
      reset: () => {
        // Clear localStorage and reset state
        localStorage.removeItem("register-storage");
        set({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          passphrase: "",
          publicKey: null,
          encryptedPrivateKeyBundle: null,
        });
      },
    }),
    {
      name: "register-storage",
      // Only persist form data, not sensitive keys by default
      partialize: (state) => ({
        name: state.name,
        email: state.email,
        password: state.password,
        confirmPassword: state.confirmPassword,
        passphrase: state.passphrase,
        // Don't persist keys for security - they should be regenerated
        publicKey: null,
        encryptedPrivateKeyBundle: null,
      }),
    }
  )
);
