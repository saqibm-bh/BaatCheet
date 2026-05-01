import dotenv from "dotenv";
dotenv.config();

const parsePositiveIntOrDefault = (
  value: string | undefined,
  fallback: number
): number => {
  const parsed = parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const parseCommaSeparatedValues = (value: string | undefined): string[] => {
  if (!value) return [];

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export const environment = process.env.NODE_ENV;
export const port = parsePositiveIntOrDefault(process.env.PORT, 5000);
export const serverUrl = process.env.SERVER_URL?.trim();
const frontendUrls = parseCommaSeparatedValues(process.env.FRONTEND_URL);

export const db = {
  name: process.env.DB_NAME || "",
  url: process.env.MONGO_URI || process.env.DB_URL || "",
  minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || "5"),
  maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || "10"),
};

const defaultDevOrigins = [
  "http://localhost:3000",
  "http://localhost:3002",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];

export const allowedOrigins = Array.from(
  new Set([
    ...(environment !== "production" ? defaultDevOrigins : []),
    ...frontendUrls,
  ])
);

export const cookieValidity = process.env.COOKIE_VALIDITY_SEC || "0";

export const tokenInfo = {
  jwtSecretKey: process.env.JWT_SECRET_KEY || "",
  accessTokenValidity: parseInt(process.env.ACCESS_TOKEN_VALIDITY_SEC || "0"),
  refreshTokenValidity: parseInt(process.env.REFRESH_TOKEN_VALIDITY_SEC || "0"),
  issuer: process.env.TOKEN_ISSUER || "",
  audience: process.env.TOKEN_AUDIENCE || "",
};

export const ai = {
  maxSummaryMessages: parsePositiveIntOrDefault(
    process.env.SUMMARY_MAX_MESSAGES,
    50
  ),
};

export const openrouter = {
  apiKey: process.env.OPENROUTER_API_KEY || "",
  model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
  baseUrl: "https://openrouter.ai/api/v1/chat/completions",
};

export const cloudinary = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  apiKey: process.env.CLOUDINARY_API_KEY || "",
  apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  folder: process.env.CLOUDINARY_FOLDER || "baatcheet",
  startupCheck:
    typeof process.env.CLOUDINARY_STARTUP_CHECK === "string"
      ? process.env.CLOUDINARY_STARTUP_CHECK !== "false"
      : environment === "production",
};

export const mediaUploadPolicy = {
  maxImageBytes:
    parsePositiveIntOrDefault(process.env.CLOUDINARY_MAX_IMAGE_SIZE_MB, 10) *
    1024 *
    1024,
  maxVideoBytes:
    parsePositiveIntOrDefault(process.env.CLOUDINARY_MAX_VIDEO_SIZE_MB, 50) *
    1024 *
    1024,
  maxRawBytes:
    parsePositiveIntOrDefault(process.env.CLOUDINARY_MAX_RAW_SIZE_MB, 20) *
    1024 *
    1024,
};
