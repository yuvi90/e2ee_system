import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import Button from "./Button";
import { Link } from "react-router-dom";

// import { NAV_LINKS } from "../config/constants";

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand-dark/80 backdrop-blur-md border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="cursor-pointer">
            <div className="shrink-0">
              <Logo />
            </div>
          </Link>

          {/* Desktop Navigation */}
          {/* <nav className="hidden md:flex space-x-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav> */}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="cursor-pointer">
                Log In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm" className="cursor-pointer">
                Sign Up Free
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-400 hover:text-white p-2 cursor-pointer"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-brand-dark border-b border-slate-800">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {/* {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md"
              >
                {link.label}
              </a>
            ))} */}
            <div className="pt-4 flex flex-col space-y-3">
              <Link to="/login">
                <Button
                  variant="ghost"
                  className="w-full justify-start cursor-pointer"
                >
                  Log In
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  variant="primary"
                  className="w-full justify-center cursor-pointer"
                >
                  Sign Up Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
