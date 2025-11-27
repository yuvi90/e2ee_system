import { CorsOptions } from "cors";
import { ENV } from "./env";

export const corsOptions: CorsOptions = {
  origin: [
    ENV.FRONTEND_ORIGIN,
    "http://localhost:5173", // Vite default
    "http://localhost:3000", // React default
    "http://127.0.0.1:5173", // Alternative localhost
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200,
};
