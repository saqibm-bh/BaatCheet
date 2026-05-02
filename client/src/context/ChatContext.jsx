import {
  createContext,
  useContext,
  useRef,
  useState,
} from "react";
import { deleteChat, getAllcurrentUserChats } from "../api";
import { requestHandler } from "../utils";
import { useSocket } from "./SocketContext";
import { useChatMessages } from "../hooks/useChatMessages";
import { useChatSocketListeners } from "../hooks/useChatSocketListeners";

const chatContext = createContext();

// created a hook to use the chat context
export const useChat = () => useContext(chatContext);

export const ChatProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false); // state to store the socket connection status
  const [searchedUsers, setSearchedUsers] = useState(null); // state to store the stored users
  const [openAddChat, setOpenAddChat] = useState(false); // state to display the AddChat modal
  const [newChatUser, setNewChatUser] = useState(null); // storing the new user with chat is going to be created
  const [currentUserChats, setCurrentUserChats] = useState([]); // storing current user chats
  const [loadingChats, setLoadingChats] = useState(false); // state to manage loading while fetching the user chats
  const [messages, setMessages] = useState([]); // state to store the chat messages
  const [message, setMessage] = useState(""); // state to store the current message
  const [attachments, setAttachments] = useState([]); // state to store files
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingByChat, setTypingByChat] = useState({});
  const [typingUsersByChat, setTypingUsersByChat] = useState({});
  const [onlineUserIds, setOnlineUserIds] = useState(() => new Set());
  const [aiStreamByChat, setAiStreamByChat] = useState({});
  // state to manage the left menu activeSidebar has three values: ["profile", "recentChats", "searchUser"]
  const [activeLeftSidebar, setActiveLeftSidebar] = useState("recentChats");

  // state for mobile responsive
  const [isChatSelected, setIsChatSelected] = useState(false);

  // ref to maintain the current selected chat
  const currentSelectedChat = useRef();

  const { socket, socketEvents } = useSocket();

  const {
    loadingMessages,
    sendingMessage,
    messageError,
    setMessageError,
    summary,
    setSummary,
    isSummarizing,
    summaryError,
    setSummaryError,
    cancelSummaryRequest,
    getMessages,
    sendChatMessage,
    summarizeCurrentChat,
    deleteChatMessage,
    editChatMessage,
    toggleReactionOnMessage,
    updateLastMessageOfCurrentChat,
  } = useChatMessages({
    socket,
    socketEvents,
    currentSelectedChat,
    setCurrentUserChats,
    setMessages,
    message,
    setMessage,
    attachments,
    setAttachments,
  });

  useChatSocketListeners({
    socket,
    socketEvents,
    currentSelectedChat,
    setMessages,
    setIsConnected,
    setUnreadCounts,
    setCurrentUserChats,
    setTypingByChat,
    setTypingUsersByChat,
    updateLastMessageOfCurrentChat,
    setOnlineUserIds,
    setAiStreamByChat,
  });

  const isChatTyping = (chatId) => {
    if (!chatId) return false;
    return Boolean(typingByChat[chatId]);
  };

  const getTypingUsersForChat = (chatId) => {
    if (!chatId) return [];
    return typingUsersByChat[chatId] || [];
  };

  const resetUnreadCount = (chatId) => {
    if (!chatId) return;

    setUnreadCounts((prevCounts) => ({
      ...prevCounts,
      [chatId]: 0,
    }));
  };

  // get the current user chats
  const getCurrentUserChats = () => {
    requestHandler(
      async () => getAllcurrentUserChats(),
      setLoadingChats,
      (res) => {
        const { data } = res;
        setCurrentUserChats(data || []);
      },
      alert
    );
  };

  // delete chats
  const deleteUserChat = async (chatId) => {
    // alert message to confirm delete chat
    if (
      !window.confirm(
        "Are you sure you want to delete this chat? This action cannot be undone"
      )
    )
      return;

    const currentSelectedChatId = currentSelectedChat.current?._id;
    // set the current selected chat to null
    currentSelectedChat.current = null;

    // remove the chat from the current user chats
    setCurrentUserChats((prevChats) =>
      prevChats.filter((chat) => chat._id !== currentSelectedChatId)
    );

    // remove the messages of the deleted chat
    setMessages((prevMessages) =>
      prevMessages.filter((message) => message.chat !== currentSelectedChatId)
    );

    // request the server to delete the sected chat
    await requestHandler(
      async () => await deleteChat(chatId),
      null,
      (res) => {},
      alert
    );
  };

  // handle searching users
  // const searchUsers = async (query) => {
  //   requestHandler(
  //     async () => await apiClient.get(`api/users/search/${query}`),
  //     null,
  //     (res) => {
  //       const { data } = res;
  //       setSearchedUsers(data || []);
  //     },
  //     alert
  //   );
  // };

  // handle removing file from attachments
  const removeFileFromAttachments = (index) => {
    setAttachments((prevAttachments) => [
      ...prevAttachments.slice(0, index),
      ...prevAttachments.slice(index + 1),
    ]);
  };

  return (
    <chatContext.Provider
      value={{
        searchedUsers,
        setSearchedUsers,
        openAddChat,
        setOpenAddChat,
        newChatUser,
        setNewChatUser,
        currentUserChats,
        setCurrentUserChats,
        loadingChats,
        setLoadingChats,
        getCurrentUserChats,
        messages,
        setMessages,
        loadingMessages,
          sendingMessage,
          messageError,
          setMessageError,
          summary,
          setSummary,
          isSummarizing,
          summaryError,
          setSummaryError,
          cancelSummaryRequest,
        getMessages,
        currentSelectedChat,
        message,
        setMessage,
        attachments,
        setAttachments,
        sendChatMessage,
          summarizeCurrentChat,
        removeFileFromAttachments,
        activeLeftSidebar,
        setActiveLeftSidebar,
        deleteChatMessage,
        editChatMessage,
        toggleReactionOnMessage,
        deleteUserChat,
        isChatSelected,
        setIsChatSelected,
        unreadCounts,
        resetUnreadCount,
        isChatTyping,
        getTypingUsersForChat,
        onlineUserIds,
        aiStreamByChat,
      }}
    >
      {children}
    </chatContext.Provider>
  );
};
