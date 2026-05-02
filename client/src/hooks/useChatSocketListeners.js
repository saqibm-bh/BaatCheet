import { useCallback, useEffect, useRef } from "react";

export const useChatSocketListeners = ({
  socket,
  socketEvents,
  currentSelectedChat,
  setMessages,
  setIsConnected,
  setUnreadCounts,
  setCurrentUserChats,
  setTypingByChat,
  updateLastMessageOfCurrentChat,
  setOnlineUserIds,
  setAiStreamByChat,
}) => {
  const streamErrorTimeoutsRef = useRef({});

  // handle on message received event from server
  // ie when a new message is sent to the server and the server sends a event to participants of chat with current message

  // const onMessageReceived = useCallback(message) => {
  const onMessageReceived = useCallback((message) => {
    const isCurrentChatOpen = currentSelectedChat.current?._id === message.chat;

    if (isCurrentChatOpen) {
      setMessages((prevMsgs) => {
        const alreadyExists = prevMsgs.some(
          (msg) => msg?._id?.toString?.() === message?._id?.toString?.()
        );

        if (alreadyExists) return prevMsgs;
        return [...prevMsgs, message];
      });
      setUnreadCounts((prevCounts) => ({
        ...prevCounts,
        [message.chat]: 0,
      }));
    } else {
      setUnreadCounts((prevCounts) => ({
        ...prevCounts,
        [message.chat]: (prevCounts[message.chat] || 0) + 1,
      }));
    }

    if (!message.visibleOnlyTo) {
      // update the last message of the current chat
      updateLastMessageOfCurrentChat(message.chat, message);
    }
  }, [
    currentSelectedChat,
    setMessages,
    setUnreadCounts,
    updateLastMessageOfCurrentChat,
  ]);
  // ,
  // [messages, currentUserChats]

  // handle when a message is deleted
  const onMessageDeleted = useCallback(
    (payload) => {
      setMessages((prevMsgs) =>
        prevMsgs.filter(
          (msg) => msg._id.toString() !== payload.messageId.toString()
        )
      );
    },
    [setMessages]
  );

  const onMessageUpdated = useCallback(
    (message) => {
      setMessages((prevMsgs) =>
        prevMsgs.map((msg) =>
          msg._id?.toString() === message._id?.toString() ? message : msg
        )
      );
      updateLastMessageOfCurrentChat(message.chat, message);
    },
    [setMessages, updateLastMessageOfCurrentChat]
  );

  const onMessageReactionUpdated = useCallback(
    (message) => {
      setMessages((prevMsgs) =>
        prevMsgs.map((msg) =>
          msg._id?.toString() === message._id?.toString() ? message : msg
        )
      );
    },
    [setMessages]
  );

  const onConnected = useCallback(() => setIsConnected(true), [setIsConnected]);
  const onDisconnected = useCallback(
    () => setIsConnected(false),
    [setIsConnected]
  );

  const onStartTyping = useCallback(
    (chatId) => {
      if (!chatId) return;

      setTypingByChat((prev) => ({
        ...prev,
        [chatId]: true,
      }));
    },
    [setTypingByChat]
  );

  const onStopTyping = useCallback(
    (chatId) => {
      if (!chatId) return;

      setTypingByChat((prev) => {
        const next = { ...prev };
        delete next[chatId];
        return next;
      });
    },
    [setTypingByChat]
  );

  const onNewChat = useCallback(
    (chat) => {
      if (!chat?._id) return;

      setCurrentUserChats((prevChats) => {
        const existingChatIndex = prevChats.findIndex(
          (existingChat) => existingChat._id === chat._id
        );

        if (existingChatIndex >= 0) {
          const mergedChat = {
            ...prevChats[existingChatIndex],
            ...chat,
          };

          const remainingChats = prevChats.filter(
            (existingChat) => existingChat._id !== chat._id
          );

          return [mergedChat, ...remainingChats];
        }

        return [chat, ...prevChats];
      });
    },
    [setCurrentUserChats]
  );

  const onActiveUsers = useCallback(
    (userIds) => {
      const normalizedIds = Array.isArray(userIds) ? userIds : [];
      setOnlineUserIds(new Set(normalizedIds));
    },
    [setOnlineUserIds]
  );

  const onUserOnline = useCallback(
    (userId) => {
      if (!userId) return;

      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    },
    [setOnlineUserIds]
  );

  const onUserOffline = useCallback(
    (userId) => {
      if (!userId) return;

      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    },
    [setOnlineUserIds]
  );

  const onMessageChunk = useCallback(
    (payload) => {
      if (!payload?.chatId || !payload?.chunk) return;

      setAiStreamByChat((prev) => {
        const previousEntry = prev[payload.chatId] || {
          text: "",
          senderId: payload.senderId,
        };

        return {
          ...prev,
          [payload.chatId]: {
            text: `${previousEntry.text || ""}${payload.chunk}`,
            senderId: payload.senderId || previousEntry.senderId,
            isLoadingFirstChunk: false,
            isPrivateQuery:
              typeof payload.isPrivateQuery === "boolean"
                ? payload.isPrivateQuery
                : previousEntry.isPrivateQuery,
          },
        };
      });
    },
    [setAiStreamByChat]
  );

  const onMessageStreamStart = useCallback(
    (payload) => {
      if (!payload?.chatId) return;

      setAiStreamByChat((prev) => ({
        ...prev,
        [payload.chatId]: {
          text: "",
          senderId: payload.senderId,
          isLoadingFirstChunk: true,
          isPrivateQuery: Boolean(payload.isPrivateQuery),
        },
      }));
    },
    [setAiStreamByChat]
  );

  const onMessageComplete = useCallback(
    (payload) => {
      if (!payload?.chatId) return;

      setAiStreamByChat((prev) => {
        if (!prev[payload.chatId]) return prev;
        const next = { ...prev };
        delete next[payload.chatId];
        return next;
      });
    },
    [setAiStreamByChat]
  );

  const onMessageStreamError = useCallback(
    (payload) => {
      if (!payload?.chatId) return;

      setAiStreamByChat((prev) => ({
        ...prev,
        [payload.chatId]: {
          text: payload.message || "AI is currently unavailable. Please try again shortly.",
          senderId: payload.senderId,
          isLoadingFirstChunk: false,
          isError: true,
          isPrivateQuery: Boolean(payload.isPrivateQuery),
        },
      }));

      if (streamErrorTimeoutsRef.current[payload.chatId]) {
        window.clearTimeout(streamErrorTimeoutsRef.current[payload.chatId]);
      }

      streamErrorTimeoutsRef.current[payload.chatId] = window.setTimeout(() => {
        setAiStreamByChat((prev) => {
          const current = prev[payload.chatId];
          if (!current?.isError) return prev;
          const next = { ...prev };
          delete next[payload.chatId];
          return next;
        });
        delete streamErrorTimeoutsRef.current[payload.chatId];
      }, 5000);
    },
    [setAiStreamByChat]
  );

  useEffect(() => {
    if (!socket) return;

    // setup all the listeners for the socket events from server
    socket.on(socketEvents.CONNECTED_EVENT, onConnected);
    socket.on(socketEvents.DISCONNECT_EVENT, onDisconnected);
    socket.on(socketEvents.NEW_CHAT_EVENT, onNewChat);
    socket.on(socketEvents.START_TYPING_EVENT, onStartTyping);
    socket.on(socketEvents.STOP_TYPING_EVENT, onStopTyping);
    socket.on(socketEvents.MESSAGE_RECEIVED_EVENT, onMessageReceived);
    socket.on(socketEvents.MESSAGE_DELETE_EVENT, onMessageDeleted);
    socket.on(socketEvents.MESSAGE_UPDATE_EVENT, onMessageUpdated);
    socket.on(socketEvents.MESSAGE_REACTION_EVENT, onMessageReactionUpdated);
    socket.on(socketEvents.MESSAGE_STREAM_START_EVENT, onMessageStreamStart);
    socket.on(socketEvents.MESSAGE_CHUNK_EVENT, onMessageChunk);
    socket.on(socketEvents.MESSAGE_COMPLETE_EVENT, onMessageComplete);
    socket.on(socketEvents.MESSAGE_STREAM_ERROR_EVENT, onMessageStreamError);
    socket.on(socketEvents.ACTIVE_USERS_EVENT, onActiveUsers);
    socket.on(socketEvents.USER_ONLINE_EVENT, onUserOnline);
    socket.on(socketEvents.USER_OFFLINE_EVENT, onUserOffline);

    return () => {
      // remove all the listeners for the socket events
      socket.off(socketEvents.CONNECTED_EVENT, onConnected);
      socket.off(socketEvents.DISCONNECT_EVENT, onDisconnected);
      socket.off(socketEvents.NEW_CHAT_EVENT, onNewChat);
      socket.off(socketEvents.START_TYPING_EVENT, onStartTyping);
      socket.off(socketEvents.STOP_TYPING_EVENT, onStopTyping);
      socket.off(socketEvents.MESSAGE_RECEIVED_EVENT, onMessageReceived);
      socket.off(socketEvents.MESSAGE_DELETE_EVENT, onMessageDeleted);
      socket.off(socketEvents.MESSAGE_UPDATE_EVENT, onMessageUpdated);
      socket.off(socketEvents.MESSAGE_REACTION_EVENT, onMessageReactionUpdated);
      socket.off(socketEvents.MESSAGE_STREAM_START_EVENT, onMessageStreamStart);
      socket.off(socketEvents.MESSAGE_CHUNK_EVENT, onMessageChunk);
      socket.off(socketEvents.MESSAGE_COMPLETE_EVENT, onMessageComplete);
      socket.off(socketEvents.MESSAGE_STREAM_ERROR_EVENT, onMessageStreamError);
      socket.off(socketEvents.ACTIVE_USERS_EVENT, onActiveUsers);
      socket.off(socketEvents.USER_ONLINE_EVENT, onUserOnline);
      socket.off(socketEvents.USER_OFFLINE_EVENT, onUserOffline);

      Object.values(streamErrorTimeoutsRef.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      streamErrorTimeoutsRef.current = {};
    };
  }, [
    socket,
    socketEvents,
    onConnected,
    onDisconnected,
    onNewChat,
    onStartTyping,
    onStopTyping,
    onMessageReceived,
    onMessageDeleted,
    onMessageUpdated,
    onMessageReactionUpdated,
    onMessageStreamStart,
    onMessageChunk,
    onMessageComplete,
    onMessageStreamError,
    onActiveUsers,
    onUserOnline,
    onUserOffline,
  ]);
};
