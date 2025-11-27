import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Key } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import {
  FormInput,
  FormButton,
} from "../../../shared/components/forms/FormComponents";
import { useLogin } from "../../../shared/hooks/useAuth";
import {
  loginSchema,
  type LoginFormData,
} from "../../../shared/schemas/auth.schemas";

const Login: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const { mutate: login, isPending, error } = useLogin();
  const containerRef = useRef<HTMLDivElement>(null);

  // GSAP Animations on Mount
  useGSAP(
    () => {
      // Animate the card in from bottom
      gsap.from(".login-card", {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });

      // Animate background elements
      gsap.from(".bg-glow", {
        scale: 0.8,
        opacity: 0,
        duration: 2,
        stagger: 0.3,
        ease: "power2.out",
      });

      // Stagger form elements
      gsap.from(".form-item", {
        x: -20,
        opacity: 0,
        duration: 0.6,
        delay: 0.3,
        stagger: 0.1,
        ease: "power2.out",
      });

      // Warning toast pop in
      gsap.from(".warning-toast", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        delay: 1.2,
        ease: "back.out(1.7)",
      });
    },
    { scope: containerRef }
  );

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
    <div
      className="grow pt-32 bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden"
      ref={containerRef}
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="bg-glow absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px]" />
        <div className="bg-glow absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Login Card */}
        <div className="login-card bg-card border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 p-8 mb-6">
          <div className="text-center mb-8 form-item">
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Log in to SecureShare
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Try{" "}
              <span className="text-slate-200 bg-slate-800 px-1 rounded">
                unverified@example.com
              </span>{" "}
              to test verify flow
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="form-item">
              <FormInput
                name="email"
                register={register}
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                error={errors.email}
              />
            </div>

            <div className="form-item">
              <FormInput
                name="password"
                register={register}
                label="Password"
                type="password"
                placeholder="*** Enter your password"
                error={errors.password}
                showToggle
              />
            </div>

            {error && (
              <div className="form-item text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                {(error as Error).message}
              </div>
            )}

            <div className="flex justify-end form-item">
              <a
                href="#"
                className="text-sm text-blue-500 hover:text-blue-400 transition-colors cursor-pointer"
              >
                Forgot Password?
              </a>
            </div>

            <div className="form-item">
              <FormButton
                type="submit"
                className="w-full py-3 text-base"
                isLoading={isPending}
                disabled={isPending || !isValid}
              >
                Log In
              </FormButton>
            </div>
          </form>

          <div className="mt-6 text-center form-item">
            <p className="text-slate-400 text-sm">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-blue-500 hover:text-blue-400 font-medium transition-colors cursor-pointer"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Private Key Warning Toast */}
        <div className="warning-toast bg-yellow-950/20 border border-yellow-700/30 rounded-xl p-4 flex items-start gap-4">
          <div className="shrink-0 mt-0.5">
            <Key className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h4 className="text-yellow-500 font-medium text-sm mb-1">
              Private Key Not Found
            </h4>
            <p className="text-yellow-200/60 text-sm leading-relaxed">
              No local private key was detected on this device. You will be
              prompted to import your key or create a new account after logging
              in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
