import React from "react";
import { HOW_IT_WORKS_STEPS } from "../../../shared/constants/constants";

const HowItWorks: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-white">How It Works</h2>
      </div>

      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-8 top-8 bottom-8 w-px bg-slate-800 md:left-1/2 md:-ml-px"></div>

        <div className="space-y-12">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <div
              key={index}
              className="relative flex flex-col md:flex-row items-start md:items-center group"
            >
              {/* Icon Bubble */}
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-16 h-16 rounded-full bg-brand-dark border border-slate-700 flex items-center justify-center z-10 group-hover:border-brand-blue transition-colors">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-brand-blue" />
                </div>
              </div>

              {/* Content Layout: Alternating sides on desktop */}
              <div
                className={`ml-24 md:ml-0 md:w-1/2 ${
                  index % 2 === 0
                    ? "md:pr-16 md:text-right"
                    : "md:pl-16 md:left-1/2 relative"
                }`}
              >
                <div className="bg-transparent">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 md:block">
                    <span className="md:hidden text-brand-blue text-sm font-mono mr-2">
                      {step.step}.
                    </span>
                    {step.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Spacer for the other side on desktop */}
              <div className="hidden md:block md:w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
