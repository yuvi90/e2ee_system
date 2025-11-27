import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { StepOne, StepTwo, StepThree } from "../components";
import { useRegisterStore } from "../register.store";

const Register: React.FC = () => {
  // const resetFlow = useRegisterStore((state) => state.reset);
  const {
    name,
    email,
    password,
    confirmPassword,
    passphrase,
    publicKey,
    encryptedPrivateKeyBundle,
  } = useRegisterStore();
  const location = useLocation();

  // Reset flow if user navigates away and comes back to start (optional UX choice)
  // useEffect(() => {
  //   if (location.pathname === "/register") {
  //     resetFlow();
  //   }
  // }, [location.pathname, resetFlow]);

  // Route protection logic
  const getProtectedElement = (step: number, element: React.ReactElement) => {
    const currentPath = location.pathname;

    // Step 1 is always accessible
    if (step === 1) return element;

    // Step 2 requires step 1 to be completed
    if (step === 2) {
      const step1Complete =
        name && email && password && confirmPassword && passphrase;
      if (!step1Complete && currentPath.includes("step-2")) {
        return <Navigate to="/register/step-1" replace />;
      }
      return element;
    }

    // Step 3 requires steps 1 and 2 to be completed
    if (step === 3) {
      const step1Complete =
        name && email && password && confirmPassword && passphrase;
      const step2Complete = publicKey && encryptedPrivateKeyBundle;

      if (!step1Complete && currentPath.includes("step-3")) {
        return <Navigate to="/register/step-1" replace />;
      }
      if (!step2Complete && currentPath.includes("step-3")) {
        return <Navigate to="/register/step-2" replace />;
      }
      return element;
    }

    return element;
  };

  return (
    <div className="grow pt-32 pb-20 overflow-x-hidden">
      <main className="container mx-auto px-4 max-w-3xl pt-12 md:pt-16">
        <div className="text-center mb-12 space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Create Your Secure Account
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
            Follow the steps below to create a zero-knowledge account.
          </p>
        </div>

        <div className="relative max-w-3xl mx-auto min-h-[400px]">
          <Routes>
            <Route index element={<Navigate to="step-1" replace />} />

            <Route
              path="step-1"
              element={getProtectedElement(
                1,
                <div>
                  <StepOne />
                </div>
              )}
            />

            <Route
              path="step-2"
              element={getProtectedElement(
                2,
                <div>
                  <StepTwo />
                </div>
              )}
            />

            <Route
              path="step-3"
              element={getProtectedElement(
                3,
                <div>
                  <StepThree />
                </div>
              )}
            />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Register;
