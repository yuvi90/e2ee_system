import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../shared/components";

const CTA: React.FC = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative rounded-2xl overflow-hidden bg-brand-blue px-6 py-16 sm:p-16 text-center shadow-2xl max-w-5xl mx-auto">
        {/* Background decorative circles */}
        <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to share securely?
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-10 text-lg">
            Create your free account today and experience the peace of mind that
            comes with true end-to-end encrypted file sharing. No credit card
            required.
          </p>

          <Link to="/register" className="cursor-pointer">
            <Button variant="white" size="lg" className="cursor-pointer">
              Get Started for Free
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTA;
