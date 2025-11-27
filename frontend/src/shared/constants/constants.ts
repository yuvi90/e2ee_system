import type { NavItem, FeatureItem, StepItem } from "../shared/types/types";
import {
  Lock,
  Timer,
  UploadCloud,
  Link as LinkIcon,
  Send,
  Zap,
} from "lucide-react";

export const NAV_LINKS: NavItem[] = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About Us", href: "#about" },
];

export const FEATURES: FeatureItem[] = [
  {
    title: "Unbreakable Security",
    description:
      "With end-to-end encryption, only you and your recipient can access your files. Not even we can see them.",
    icon: Lock,
  },
  {
    title: "Instant Encryption",
    description:
      "Your files are encrypted immediately upon upload, ensuring they are secure even before they leave your computer.",
    icon: Zap,
  },
  // {
  //   title: 'Share Anonymously',
  //   description: 'Generate secure, anonymous links to share your files without revealing your identity.',
  //   // This one uses a custom text graphic in the design instead of an icon
  //   customDisplay: null,
  // },
  {
    title: "Total Control",
    description:
      "Set self-destruct timers on your files, ensuring they are automatically deleted after a set period.",
    icon: Timer,
  },
];

export const HOW_IT_WORKS_STEPS: StepItem[] = [
  {
    step: 1,
    title: "Upload & Encrypt",
    description:
      "Select your file. It's instantly encrypted in your browser before it even touches our servers.",
    icon: UploadCloud,
  },
  {
    step: 2,
    title: "Generate Secure Link",
    description:
      "A unique, secure link is created. Only this link can be used to access the encrypted file.",
    icon: LinkIcon,
  },
  {
    step: 3,
    title: "Share Privately",
    description:
      "Share the link with your recipient. Once they open it, the file is decrypted in their browser.",
    icon: Send,
  },
];
