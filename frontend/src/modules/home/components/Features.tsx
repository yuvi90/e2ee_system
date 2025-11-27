import React from "react";
import { FEATURES } from "../../../shared/constants/constants";

const Features: React.FC = () => {
  return (
    <section
      id="features"
      className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Your Data, Your Keys, Your Control
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          We believe your files are for your eyes only. Our platform is built on
          a foundation of security and privacy, giving you peace of mind with
          every share.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {FEATURES.map((feature, index) => (
          <div
            key={index}
            className="bg-[#1A202C] border border-slate-800 p-8 rounded-xl hover:border-slate-600 transition-colors duration-300 flex flex-col"
          >
            <div className="mb-6">
              {feature.icon ? (
                <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-green-400" />
                </div>
              ) : (
                <div className="h-12 flex items-center">
                  <span
                    className="font-mono text-2xl tracking-widest text-green-400/90"
                    style={{ textShadow: "0 0 10px rgba(74, 222, 128, 0.3)" }}
                  >
                    INCOGNITO
                  </span>
                </div>
              )}
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">
              {feature.title}
            </h3>
            <p className="text-slate-400 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
