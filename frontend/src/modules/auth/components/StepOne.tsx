import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";

import { useRegisterStore } from "../register.store";
import { useDebouncedEmailCheck } from "../../../shared/hooks/useAuth";
import {
  stepOneSchema,
  type StepOneFormData,
} from "../../../shared/schemas/auth.schemas";
import {
  FormInput,
  FormButton,
  PasswordStrength,
} from "../../../shared/components/forms/FormComponents";
import { StepCard } from "./StepCard";

export const StepOne: React.FC = () => {
  const navigate = useNavigate();
  const { email: storedEmail, setField } = useRegisterStore();

  // Initialize form with react-hook-form
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<StepOneFormData>({
    resolver: zodResolver(stepOneSchema),
    mode: "onChange",
    defaultValues: {
      email: storedEmail || "",
    },
  });

  // Watch email for debounced checking
  const watchedEmail = watch("email");
  const watchedPassword = watch("password");

  // Debounced email availability check
  const {
    data: emailCheck,
    isLoading: emailCheckLoading,
    error: emailCheckError,
  } = useDebouncedEmailCheck(watchedEmail);

  // Email validation state
  const getEmailValidationState = () => {
    if (!watchedEmail || errors.email) return "idle";
    if (emailCheckLoading) return "checking";
    if (emailCheckError) return "invalid";
    if (emailCheck?.isAvailable) return "valid";
    if (emailCheck?.exists) return "invalid";
    return "idle";
  };

  const getEmailValidationMessage = () => {
    if (emailCheckLoading) return "Checking availability...";
    if (emailCheck?.isAvailable) return "Email is available";
    if (emailCheck?.exists) return "This email is already registered";
    if (emailCheckError) return "Failed to check email availability";
    return "";
  };

  // Form submission
  const onSubmit = async (data: StepOneFormData) => {
    // Store form data in Zustand store
    Object.entries(data).forEach(([key, value]) => {
      setField(key, value);
    });

    // Small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Navigate to next step
    navigate("/register/step-2");
  };

  // Check if form is ready to submit
  const isFormReady =
    isValid && !emailCheckLoading && emailCheck?.isAvailable === true;

  return (
    <StepCard
      stepNumber={1}
      title="Account Details"
      description="Your password and passphrase are never sent to our servers. Keep them safe."
      isCompleted={false}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Full Name */}
        <FormInput
          register={register}
          name="name"
          label="Full Name"
          placeholder="Enter your full name"
          type="text"
          error={errors.name}
          autoComplete="name"
          required
        />

        {/* Email Address */}
        <FormInput
          register={register}
          name="email"
          label="Email Address"
          placeholder="name@example.com"
          type="email"
          error={errors.email}
          autoComplete="email"
          required
          validation={true}
          validationState={getEmailValidationState()}
          validationMessage={getEmailValidationMessage()}
        />

        {/* Password */}
        <FormInput
          register={register}
          name="password"
          label="Password"
          placeholder="••••••••"
          type="password"
          error={errors.password}
          autoComplete="new-password"
          required
          description="Must be at least 8 characters with uppercase, lowercase, and number"
        />

        {/* Password Strength Indicator */}
        <PasswordStrength password={watchedPassword || ""} />

        {/* Confirm Password */}
        <FormInput
          register={register}
          name="confirmPassword"
          label="Confirm Password"
          placeholder="••••••••"
          type="password"
          error={errors.confirmPassword}
          autoComplete="new-password"
          required
        />

        {/* Security Passphrase */}
        <FormInput
          register={register}
          name="passphrase"
          label="Security Passphrase"
          placeholder="Enter a secure phrase (min 12 characters)"
          type="text"
          error={errors.passphrase}
          required
          description="Used to encrypt your private key. Choose something memorable but secure."
        />

        {/* Continue Button */}
        <div className="pt-4 flex justify-end border-t border-slate-800/50">
          <FormButton
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            disabled={!isFormReady || isSubmitting}
            className="px-6"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </FormButton>
        </div>
      </form>
    </StepCard>
  );
};
