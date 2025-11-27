import { useMutation } from "@tanstack/react-query";
import { api } from "../mock/api";
import { useAuthStore } from "../modules/auth/auth.store";
// No navigation here anymore, logic moved to component to handle verification check

export const useLogin = () => {
  const loginStore = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: async ({ email, password }: any) => {
      return await api.auth.login(email, password);
    },
    onSuccess: (data) => {
      loginStore(data.user);
      // Navigation is now handled in the component to support verification flow checks
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      return await api.auth.register(data);
    },
  });
};

export const useResendVerification = () => {
  return useMutation({
    mutationFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return { sent: true };
    },
  });
};
