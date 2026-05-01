import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteMessage,
  editMessage,
  getChatMessages,
  sendMessage,
  summarizeChat,
  toggleMessageReaction,
} from "../api";
import { requestHandler } from "../utils";

export const useChatMessages = ({
  socket,
  socketEvents,
  currentSelectedChat,
  setCurrentUserChats,
  setMessages,
  message,
  setMessage,
  attachments,
  setAttachments,
}) => {
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState(null);
  const [summary, setSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const summaryAbortControllerRef = useRef(null);
  const summaryRequestIdRef = useRef(0);

  const handleMessageError = (errorMessage) => {
    setMessageError(errorMessage || "Something went wrong");
    alert(errorMessage || "Something went wrong");
  };

  // update last message of the current selected chat with new message
  const updateLastMessageOfCurrentChat = useCallback(
    (chatId, message) => {
      setCurrentUserChats((prevChats) => {
        const chatIndex = prevChats?.findIndex((chat) => chat._id === chatId);
        if (chatIndex === -1) return prevChats;

        const nextUpdatedAt =
          message?.updatedAt || message?.createdAt || new Date().toISOString();

        const updatedChat = {
          ...prevChats[chatIndex],
          lastMessage: message,
          updatedAt: nextUpdatedAt,
        };

        // Keep UX snappy by moving recently-active chats to the top.
        const remainingChats = prevChats.filter((chat) => chat._id !== chatId);
        return [updatedChat, ...remainingChats];
      });
    },
    [setCurrentUserChats]
  );

  // function to get current selected chat messages
  const getMessages = (chatId) => {
    if (!chatId) return alert("no chat selected");

    if (!socket) return alert("socket connection not available");

    if (summaryAbortControllerRef.current) {
      summaryAbortControllerRef.current.abort();
      summaryAbortControllerRef.current = null;
    }

    setMessageError(null);
    setSummary("");
    setSummaryError(null);
    setIsSummarizing(false);

    // emit an event to join the current chat
    socket.emit(socketEvents.JOIN_CHAT_EVENT, chatId);

    requestHandler(
      async () => await getChatMessages(chatId),
      setLoadingMessages,
      (res) => {
        const { data } = res;
        setMessages(data || []);
      },
      handleMessageError
    );
  };

  const cancelSummaryRequest = useCallback(() => {
    if (summaryAbortControllerRef.current) {
      summaryAbortControllerRef.current.abort();
      summaryAbortControllerRef.current = null;
    }

    setIsSummarizing(false);
  }, []);

  const summarizeCurrentChat = async (chatId = currentSelectedChat.current?._id) => {
    if (!chatId) {
      setSummaryError("no chat selected");
      return;
    }

    if (summaryAbortControllerRef.current) {
      summaryAbortControllerRef.current.abort();
    }

    const requestId = summaryRequestIdRef.current + 1;
    summaryRequestIdRef.current = requestId;
    const abortController = new AbortController();
    summaryAbortControllerRef.current = abortController;

    setSummaryError(null);
    setIsSummarizing(true);

    try {
      const response = await summarizeChat(chatId, {
        signal: abortController.signal,
      });

      if (summaryRequestIdRef.current !== requestId) return;

      const responseData = response?.data;
      if (responseData?.statusCode === "10000") {
        setSummary(responseData?.data?.summary || "");
        return;
      }

      setSummaryError("Unable to summarize this chat");
    } catch (error) {
      const isCanceledError =
        axios.isCancel(error) ||
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError";

      if (isCanceledError) return;

      if (summaryRequestIdRef.current !== requestId) return;

      setSummaryError(
        error?.response?.data?.message || "Unable to summarize this chat"
      );
    } finally {
      if (summaryRequestIdRef.current === requestId) {
        setIsSummarizing(false);
        summaryAbortControllerRef.current = null;
      }
    }
  };

  useEffect(() => {
    return () => {
      if (summaryAbortControllerRef.current) {
        summaryAbortControllerRef.current.abort();
      }
    };
  }, []);

  // delete message
  const deleteChatMessage = async (messageId) => {
    setMessageError(null);

    setMessages((prevMsgs) =>
      prevMsgs.filter((msg) => msg._id.toString() !== messageId.toString())
    );

    await requestHandler(
      async () => await deleteMessage(messageId),
      null,
      (res) => {},
      handleMessageError
    );
  };

  // send message
  const sendChatMessage = async (options = {}) => {
    if (!socket || !currentSelectedChat.current?._id) return;

    setMessageError(null);

    await requestHandler(
      async () =>
        await sendMessage(
          currentSelectedChat.current?._id,
          message,
          attachments,
          options
        ),
      setSendingMessage,
      (res) => {
        setMessage("");
        setAttachments([]);
        setMessages((prevMsgs) => [...prevMsgs, res.data]);

        // update the last message of the chat
        updateLastMessageOfCurrentChat(
          currentSelectedChat.current?._id,
          res.data
        );
      },
      handleMessageError
    );
  };

  const editChatMessage = async (messageId, content) => {
    setMessageError(null);

    await requestHandler(
      async () => await editMessage(messageId, content),
      null,
      (res) => {
        const updatedMessage = res?.data;
        if (!updatedMessage?._id) return;

        setMessages((prevMsgs) =>
          prevMsgs.map((msg) =>
            msg._id?.toString() === updatedMessage._id?.toString()
              ? updatedMessage
              : msg
          )
        );

        updateLastMessageOfCurrentChat(updatedMessage.chat, updatedMessage);
      },
      handleMessageError
    );
  };

  const toggleReactionOnMessage = async (messageId, emoji) => {
    setMessageError(null);

    await requestHandler(
      async () => await toggleMessageReaction(messageId, emoji),
      null,
      (res) => {
        const updatedMessage = res?.data;
        if (!updatedMessage?._id) return;

        setMessages((prevMsgs) =>
          prevMsgs.map((msg) =>
            msg._id?.toString() === updatedMessage._id?.toString()
              ? updatedMessage
              : msg
          )
        );
      },
      handleMessageError
    );
  };

  return {
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
  };
};
