import React, { useState } from "react";
import { ShieldCheck, Mail, RefreshCw, Check } from "lucide-react";
// import { Button } from "./Button";
// import { cn } from "../../../shared/utils/utils";
// import { useResendVerification } from "../../../hooks/useAuth";
import { Link } from "react-router-dom";

export const SuccessScreen: React.FC = () => {
  // const [resent, setResent] = useState(false);
  // const { mutate: resend, isPending } = useResendVerification();

  // const handleResend = () => {
  //   resend(undefined, {
  //     onSuccess: () => {
  //       setResent(true);
  //       setTimeout(() => setResent(false), 5000);
  //     },
  //   });
  // };

  return (
    <div className="text-center animate-in zoom-in-95 fade-in duration-700">
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center relative z-10 border border-emerald-500/20">
            <ShieldCheck className="w-12 h-12 text-emerald-500" />
          </div>
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
        </div>
      </div>

      <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
        Account Created!
      </h2>
      <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
        Your secure vault is ready. To activate your account and access your
        data, please verify your email address.
      </p>

      <div className="max-w-md mx-auto bg-card border border-slate-800 rounded-2xl p-8 mb-10 shadow-xl relative overflow-hidden">
        {/* Highlight effect for the active step */}
        <div className="absolute top-0 left-0 w-1 h-1/2 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" />

        <div className="flex items-start gap-5 mb-8 relative">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-900/50 shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-white font-semibold text-lg">
              Verify Email Address
            </p>
            <p className="text-blue-200/70 text-sm mt-1">
              We sent a link to your inbox. Click it to verify.
            </p>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-800 ml-5 mb-2 -mt-4" />

        <div className="flex items-center gap-5 opacity-50">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 text-sm font-bold border border-slate-700 shrink-0">
            2
          </div>
          <div className="text-left">
            <Link
              to="/login"
              className="text-slate-300 font-medium hover:text-white hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-slate-500 text-sm">
          Didn't receive the email? Check your spam folder or
        </p>
        {/* <Button
          variant="ghost"
          onClick={handleResend}
          isLoading={isPending}
          disabled={resent}
          className={cn(
            "text-blue-400 hover:text-blue-300 hover:bg-blue-950/50",
            resent &&
              "text-emerald-400 hover:text-emerald-400 hover:bg-emerald-950/30"
          )}
          icon={
            resent ? (
              <Check className="w-4 h-4" />
            ) : (
              <RefreshCw
                className={cn("w-4 h-4", isPending && "animate-spin")}
              />
            )
          }
        >
          {resent ? "Email Resent Successfully" : "Resend Verification Email"}
        </Button> */}
      </div>
    </div>
  );
};
