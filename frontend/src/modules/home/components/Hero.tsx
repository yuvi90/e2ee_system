import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../shared/components";

const Hero: React.FC = () => {
  return (
    <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-4 max-w-7xl mx-auto sm:px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
        {/* Left Content */}
        <div className="lg:col-span-6 text-center lg:text-left space-y-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            Share Files with <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-white to-slate-400">
              Absolute Privacy
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            The simple, secure way to share sensitive files with end-to-end
            encryption. No registration required for small files.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link to="/register" className="cursor-pointer">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto cursor-pointer"
              >
                Create Your Secure Account
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Content / Graphic Placeholder */}
        <div className="lg:col-span-6 mt-12 lg:mt-0">
          <div className="relative rounded-xl overflow-hidden shadow-2xl bg-slate-800 aspect-4/3 border border-slate-700/50 group">
            {/* Abstract visual representation of secure file transfer */}
            <div className="absolute inset-0 bg-linear-to-br from-slate-800 to-slate-900"></div>

            {/* Animated elements simulation */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xs">
              <div className="bg-slate-900/80 backdrop-blur rounded-lg p-6 border border-slate-700 shadow-xl">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-10 h-10 rounded bg-brand-blue/20 flex items-center justify-center">
                    <div className="w-5 h-5 bg-brand-blue rounded-sm"></div>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-slate-700 rounded w-3/4 mb-2"></div>
                    <div className="h-2 bg-slate-700 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
                  <div className="bg-brand-blue h-1.5 rounded-full w-[75%]"></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Encrypted.zip</span>
                  <span>75%</span>
                </div>
              </div>
            </div>

            {/* Decorative glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
