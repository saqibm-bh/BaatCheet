import { createContext, useContext, useEffect, useState } from "react";
import { LocalStorage } from "../utils";
import socketio from "socket.io-client";

// method to establish a socket connection
const getSocket = () => {
  const token = LocalStorage.get("token"); // get token from local storage
  const socketUrl = (import.meta.env?.VITE_SERVER_URL || "").trim().replace(/\/+$/, "");

  if (!socketUrl) {
    throw new Error(
      "Missing socket URL. Set VITE_SERVER_URL in client environment."
    );
  }

  // create a socket connection with the provided URI and authentication
  return socketio(socketUrl, {
    withCredentials: true,
    auth: { token },
    transports: ["websocket", "polling"],
  });
};

const SocketContext = createContext({ socket: null });

// custom hook to access socket instance from context
const useSocket = () => useContext(SocketContext);

const socketEvents = {
  CONNECTED_EVENT: "connected",
  DISCONNECT_EVENT: "disconnect",
  JOIN_CHAT_EVENT: "joinChat",
  NEW_CHAT_EVENT: "newChatEvent",
  START_TYPING_EVENT: "startTyping",
  STOP_TYPING_EVENT: "stopTyping",
  MESSAGE_RECEIVED_EVENT: "messageReceived",
  MESSAGE_UPDATE_EVENT: "messageUpdated",
  MESSAGE_REACTION_EVENT: "messageReactionUpdated",
  LEAVE_CHAT_EVENT: "leaveChat",
  UPDATE_GROUP_NAME_EVENT: "updateGroupName",
  MESSAGE_DELETE_EVENT: "messageDeleted",
  MESSAGE_CHUNK_EVENT: "messageChunk",
  MESSAGE_COMPLETE_EVENT: "messageComplete",
  ACTIVE_USERS_EVENT: "activeUsers",
  USER_ONLINE_EVENT: "userOnline",
  USER_OFFLINE_EVENT: "userOffline",
};

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketInstance = getSocket();
    setSocket(socketInstance);

    // disconnect socket when component in unmounted
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, socketEvents }}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketProvider, useSocket };
