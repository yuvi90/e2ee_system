export interface StepData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  passphrase: string;
}

export interface KeyGenerationStatus {
  started: boolean;
  completed: boolean;
  step1Complete: boolean;
  step2Complete: boolean;
  step3Complete: boolean;
}
