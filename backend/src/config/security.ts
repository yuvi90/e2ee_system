import helmet from "helmet";
import { Application } from "express";

/**
 * Applies security middleware globally.
 * Includes Helmet and other secure header configurations.
 */
export const applySecurity = (app: Application): void => {
  app.use(
    helmet({
      contentSecurityPolicy: false, // disable if serving self-hosted scripts
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: "no-referrer" },
    })
  );

  // Disable the 'X-Powered-By' header (reveals Express version)
  app.disable("x-powered-by");
};
