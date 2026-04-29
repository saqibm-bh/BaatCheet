const normalizeUrl = (value) => {
  if (!value || typeof value !== "string") return "";
  return value.trim().replace(/\/+$/, "");
};

const getEnvUrl = (...keys) => {
  for (const key of keys) {
    const value = normalizeUrl(import.meta.env[key]);
    if (value) return value;
  }
  return "";
};

export const apiBaseUrl = getEnvUrl("VITE_SERVER_URL", "VITE_API_URL");

export const socketBaseUrl =
  getEnvUrl("VITE_SOCKET_URL", "VITE_SOCKET_URI") || apiBaseUrl;

export const signalingBaseUrl =
  getEnvUrl("VITE_SIGNALING_URL", "VITE_SIGNALLING_SERVER_URL") ||
  socketBaseUrl ||
  apiBaseUrl;
