import React from "react";
import { Shield } from "lucide-react";

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-2 cursor-pointer select-none">
      <div className="relative">
        <Shield className="w-8 h-8 text-brand-blue fill-brand-blue/20" />
        <div className="absolute top-0 right-0 w-2 h-2 bg-green-400 rounded-full border-2 border-brand-dark"></div>
      </div>
      <span className="text-xl font-bold tracking-tight text-white">
        SecureShare
      </span>
    </div>
  );
};

export default Logo;
