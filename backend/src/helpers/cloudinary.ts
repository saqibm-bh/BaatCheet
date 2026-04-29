import { v2 as cloudinary, UploadApiOptions } from "cloudinary";
import path from "path";
import {
  cloudinary as cloudinaryConfig,
  mediaUploadPolicy,
} from "../config";
import { BadRequestError, InternalError } from "../core/ApiError";

type CloudinaryResourceType = "image" | "video" | "raw" | "auto";
type StrictCloudinaryResourceType = "image" | "video" | "raw";

type CloudinaryHealthState = {
  ok: boolean;
  message: string;
  checkedAt: string | null;
};

type CloudinaryErrorDetails = {
  message: string;
  statusCode?: number;
};

let healthState: CloudinaryHealthState = {
  ok: false,
  message: "not_checked",
  checkedAt: null,
};

const ensureCloudinaryConfigured = () => {
  if (
    !cloudinaryConfig.cloudName ||
    !cloudinaryConfig.apiKey ||
    !cloudinaryConfig.apiSecret
  ) {
    throw new InternalError(
      "Cloudinary is not configured. Check CLOUDINARY_* environment variables."
    );
  }

  cloudinary.config({
    cloud_name: cloudinaryConfig.cloudName,
    api_key: cloudinaryConfig.apiKey,
    api_secret: cloudinaryConfig.apiSecret,
    secure: true,
  });
};

const setHealthState = (ok: boolean, message: string) => {
  healthState = {
    ok,
    message,
    checkedAt: new Date().toISOString(),
  };
};

export const getCloudinaryHealthState = (): CloudinaryHealthState => {
  return healthState;
};

export const resolveCloudinaryResourceType = (
  mimeType: string
): StrictCloudinaryResourceType => {
  if (!mimeType) {
    throw new BadRequestError("file mime type is required");
  }

  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";

  // Everything else is treated as raw documents/files.
  return "raw";
};

export const validateUploadFileForCloudinary = (
  file: Express.Multer.File,
  options?: {
    allowedResourceTypes?: StrictCloudinaryResourceType[];
  }
): StrictCloudinaryResourceType => {
  if (!file) {
    throw new BadRequestError("file is required");
  }

  const resourceType = resolveCloudinaryResourceType(file.mimetype);
  const allowedResourceTypes = options?.allowedResourceTypes || [
    "image",
    "video",
    "raw",
  ];

  if (!allowedResourceTypes.includes(resourceType)) {
    throw new BadRequestError(
      `unsupported file type. Allowed: ${allowedResourceTypes.join(", ")}`
    );
  }

  const maxSizeByType: Record<StrictCloudinaryResourceType, number> = {
    image: mediaUploadPolicy.maxImageBytes,
    video: mediaUploadPolicy.maxVideoBytes,
    raw: mediaUploadPolicy.maxRawBytes,
  };

  const maxAllowedSize = maxSizeByType[resourceType];
  if (file.size > maxAllowedSize) {
    throw new BadRequestError(
      `${resourceType} file too large. Max allowed is ${Math.floor(
        maxAllowedSize / (1024 * 1024)
      )}MB`
    );
  }

  return resourceType;
};

const isRetryableCloudinaryError = (error: any): boolean => {
  const details = getCloudinaryErrorDetails(error);
  const statusCode = details.statusCode;
  const message = details.message.toLowerCase();

  if (typeof statusCode === "number" && [408, 429, 500, 502, 503, 504].includes(statusCode)) {
    return true;
  }

  return (
    message.includes("timeout") ||
    message.includes("econnreset") ||
    message.includes("temporary")
  );
};

const getCloudinaryErrorDetails = (error: any): CloudinaryErrorDetails => {
  const nestedMessage = error?.error?.message;
  const message = error?.message || nestedMessage || "Unknown cloudinary error";
  const statusCode =
    error?.http_code ||
    error?.statusCode ||
    error?.status ||
    error?.error?.http_code;

  return {
    message,
    statusCode,
  };
};

const classifyCloudinaryError = (error: any, operation: string): Error => {
  const details = getCloudinaryErrorDetails(error);
  const statusCode = details.statusCode;
  const message = details.message;

  if (typeof statusCode === "number" && [400, 404].includes(statusCode)) {
    return new BadRequestError(`Cloudinary ${operation} rejected: ${message}`);
  }

  if (typeof statusCode === "number" && [401, 403].includes(statusCode)) {
    return new InternalError(
      `Cloudinary authentication/authorization failed during ${operation}`
    );
  }

  return new InternalError(
    `Cloudinary ${operation} failed. Please retry. Details: ${message}`
  );
};

const retryCloudinaryOperation = async <T>(
  operation: string,
  executor: () => Promise<T>,
  maxAttempts = 3
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await executor();
    } catch (error: any) {
      lastError = error;
      const shouldRetry =
        attempt < maxAttempts && isRetryableCloudinaryError(error);

      if (!shouldRetry) {
        throw classifyCloudinaryError(error, operation);
      }

      const delayMs = 200 * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw classifyCloudinaryError(lastError, operation);
};

const sanitizeFileName = (fileName?: string): string | undefined => {
  if (!fileName) return undefined;

  const withoutExtension = path.parse(fileName).name;
  const normalized = withoutExtension
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || undefined;
};

export const uploadBufferToCloudinary = async ({
  fileBuffer,
  folder,
  resourceType = "auto",
  originalFileName,
}: {
  fileBuffer: Buffer;
  folder: string;
  resourceType?: CloudinaryResourceType;
  originalFileName?: string;
}): Promise<{
  secureUrl: string;
  publicId: string;
  resourceType: "image" | "video" | "raw";
}> => {
  ensureCloudinaryConfigured();

  const options: UploadApiOptions = {
    folder,
    resource_type: resourceType,
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  };

  const sanitizedName = sanitizeFileName(originalFileName);
  if (sanitizedName) {
    options.filename_override = sanitizedName;
  }

  const uploadResult = await retryCloudinaryOperation("upload", async () => {
    return new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("cloudinary upload failed"));
            return;
          }

          resolve(result);
        }
      );

      stream.end(fileBuffer);
    });
  });

  return {
    secureUrl: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    resourceType: uploadResult.resource_type,
  };
};

export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<void> => {
  if (!publicId) return;

  ensureCloudinaryConfigured();

  await retryCloudinaryOperation("delete", async () => {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
  });
};

export const verifyCloudinaryOnStartup = async (): Promise<void> => {
  try {
    ensureCloudinaryConfigured();

    await retryCloudinaryOperation("ping", async () => {
      await cloudinary.api.ping();
    }, 2);

    setHealthState(true, "ok");
  } catch (error: any) {
    const details = getCloudinaryErrorDetails(error);
    setHealthState(
      false,
      details.message || "cloudinary startup check failed"
    );
    throw error;
  }
};
