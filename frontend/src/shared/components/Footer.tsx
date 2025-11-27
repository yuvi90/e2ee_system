import React from "react";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="py-12 px-4 border-t border-slate-800 mt-12 bg-brand-dark">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-slate-500 text-sm">
          © {year} SecureShare. All rights reserved.
        </div>

        <div className="flex space-x-8">
          <a
            href="#"
            className="text-slate-400 hover:text-white text-sm transition-colors cursor-pointer"
          >
            Terms of Service
          </a>
          <a
            href="#"
            className="text-slate-400 hover:text-white text-sm transition-colors cursor-pointer"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="text-slate-400 hover:text-white text-sm transition-colors cursor-pointer"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
