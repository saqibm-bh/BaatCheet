import httpServer from "./app";
import {
  cloudinary as cloudinaryConfig,
  environment,
  port,
} from "./config";
import { verifyCloudinaryOnStartup } from "./helpers/cloudinary";

const startServer = async () => {
  try {
    if (cloudinaryConfig.startupCheck) {
      await verifyCloudinaryOnStartup();
      console.log("☁️  Cloudinary startup validation passed");
    }

    httpServer.listen(port, () => {
      console.log("⚙️  server running on port " + port);
    });
  } catch (error: any) {
    console.error(
      "Failed to validate Cloudinary at startup:",
      error?.message || error
    );

    if (environment === "production") {
      process.exit(1);
    }

    console.warn(
      "Continuing startup in non-production mode without validated Cloudinary."
    );
    httpServer.listen(port, () => {
      console.log("⚙️  server running on port " + port);
    });
  }
};

startServer();
