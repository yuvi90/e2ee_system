import React from "react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
}

export interface FeatureItem {
  title: string;
  description: string;
  icon?: LucideIcon;
  customDisplay?: React.ReactNode;
}

export interface StepItem {
  step: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface StepData {
  email: string;
  password: string;
  confirmPassword: string;
  passphrase: string;
}

export interface KeyGenerationStatus {
  started: boolean;
  completed: boolean;
  step1Complete: boolean; // Generating RSA
  step2Complete: boolean; // Encrypting
  step3Complete: boolean; // Success
}
