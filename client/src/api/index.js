import axios from "axios";
import { LocalStorage } from "../utils";
import { apiBaseUrl } from "../config/runtime";
// import FormData from "form-data";

if (!apiBaseUrl) {
  throw new Error(
    "Missing backend API URL. Set VITE_API_URL in client environment."
  );
}

// Axios instance for API requests
const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 120000,
});

apiClient.interceptors.request.use(
  (config) => {
    // retrieve user token from localStorage
    const token = LocalStorage.get("token");
    // set authorization header with bearer
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

export const loginUser = (data) => {
  return apiClient.post("/auth/login", data);
};

export const registerUser = (data) => {
  return apiClient.post("/auth/register", data);
};

export const logoutUser = () => {
  return apiClient.post("/auth/logout");
};

export const updateUserProfile = ({ username, bio, avatarFile }) => {
  const formData = new FormData();

  if (typeof username === "string") {
    formData.append("username", username);
  }

  if (typeof bio === "string") {
    formData.append("bio", bio);
  }

  if (avatarFile) {
    formData.append("avatar", avatarFile);
  }

  return apiClient.patch("/auth/profile", formData);
};

export const getAvailableUsers = (usernameOrEmail) => {
  return apiClient.get(`/api/chat/users?userId=${usernameOrEmail}`);
};

// create a new one to one chat
export const createOneToOneChat = (receiverId) => {
  return apiClient.post(`api/chat/c/${receiverId}`);
};

// get all the current user chats
export const getAllcurrentUserChats = () => {
  return apiClient.get("api/chat");
};

// get chat messages
export const getChatMessages = (chatId) => {
  return apiClient.get(`api/messages/${chatId}`);
};

export const searchChatMessages = (chatId, query, options = {}) => {
  const page = options?.page || 1;
  const limit = options?.limit || 50;

  return apiClient.get(`api/messages/${chatId}/search`, {
    params: {
      q: query,
      page,
      limit,
    },
  });
};

// summarize a chat using backend AI endpoint
export const summarizeChat = (chatId, options = {}) => {
  return apiClient.post(`api/chat/${chatId}/summarize`, null, options);
};

// send a message
export const sendMessage = (chatId, content, attachments) => {
  const formData = new FormData();
  if (content) {
    formData.append("content", content);
  }

  if (attachments) {
    attachments?.map((file) => {
      formData.append("attachments", file);
    });
  }

  return apiClient.post(`api/messages/${chatId}`, formData);
};

// create group chat
export const createGroupChat = (name, participants) => {
  const body = {
    name,
    participants,
  };
  return apiClient.post("api/chat/group", body);
};

// delete a message
export const deleteMessage = (messageId) => {
  return apiClient.delete(`api/messages/${messageId}`);
};

export const editMessage = (messageId, content) => {
  return apiClient.patch(`api/messages/${messageId}`, { content });
};

export const toggleMessageReaction = (messageId, emoji) => {
  return apiClient.post(`api/messages/${messageId}/reaction`, { emoji });
};

// delete a chat
export const deleteChat = (chatId) => {
  return apiClient.delete(`api/chat/${chatId}`);
};

export default apiClient;
