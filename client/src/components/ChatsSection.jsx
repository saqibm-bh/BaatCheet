import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveAs } from "file-saver";
import {
  BiSearch,
  BsThreeDotsVertical,
  FaFile,
  FiImage,
  ImEnlarge2,
  IoMdAttach,
  IoMdSend,
  IoVideocamOutline,
  MdArrowBackIos,
  MdDeleteOutline,
  PiDownloadSimpleBold,
  RxCross2,
} from "../assets";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import moment from "moment";
import Loading from "./Loading";
import { getOpponentParticipant, limitChar } from "../utils";
import { useConnectWebRtc } from "../context/WebRtcContext";
import ViewImage from "./ViewImage";
import { useMessageComposer } from "../hooks/useMessageComposer";
import { useSmartReplies } from "../hooks/useSmartReplies";
import { BsStars, BsLightningChargeFill } from "react-icons/bs";
import UserAvatar from "./UserAvatar";
import { useSocket } from "../context/SocketContext";
import { searchChatMessages } from "../api";
import ReactMarkdown from "react-markdown";
import { FiEye, FiEyeOff } from "react-icons/fi";

const MessageCont = ({
  isOwnMessage,
  isGroupChat,
  message,
  isSearchMatch = false,
  isActiveSearchMatch = false,
}) => {
  const { deleteChatMessage, editChatMessage, toggleReactionOnMessage } = useChat();
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [editedContent, setEditedContent] = useState(message?.content || "");
  const [isOpenView, setIsOpenView] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const messageMenuRef = useRef(null);
  const { user } = useAuth();
  const shouldRenderMarkdown = message?.contentFormat === "markdown" || message?.sender?.isAI;
  const isPrivateMessage =
    message?.visibleOnlyTo &&
    user?._id &&
    message.visibleOnlyTo.toString() === user._id.toString();

  const reactionSummary = useMemo(() => {
    const groupedReactions = {};

    (message?.reactions || []).forEach((reaction) => {
      const emoji = reaction?.emoji;
      if (!emoji) return;

      if (!groupedReactions[emoji]) {
        groupedReactions[emoji] = {
          emoji,
          count: 0,
          reactedByCurrentUser: false,
        };
      }

      groupedReactions[emoji].count += 1;
      if (reaction?.user?.toString?.() === user?._id?.toString?.()) {
        groupedReactions[emoji].reactedByCurrentUser = true;
      }
    });

    return Object.values(groupedReactions);
  }, [message?.reactions, user?._id]);

  useEffect(() => {
    setEditedContent(message?.content || "");
  }, [message?.content]);

  useEffect(() => {
    if (!showMessageMenu) return;

    const handleDocumentClick = (event) => {
      if (
        messageMenuRef.current &&
        !messageMenuRef.current.contains(event.target)
      ) {
        setShowMessageMenu(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [showMessageMenu]);

  const handleEnlargeClick = (url) => {
    setCurrentImageUrl(url);
    setIsOpenView(true);
  };
  return (
    <div className={`w-full flex my-2 animate-slide-up`}>
      <div
        className={`flex group relative ${
          isOwnMessage ? "max-w-[85%] md:max-w-[75%] ml-auto justify-end" : "max-w-[85%] md:max-w-[75%] mr-auto justify-start"
        }`}
      >
        <div
          className={`flex flex-col relative min-w-20 max-w-full px-3.5 py-2 hover:shadow-md transition-shadow duration-200 ${
            isOwnMessage 
              ? "bg-primary text-primary-foreground shadow-sm order-2 rounded-[20px] rounded-tr-[4px]" 
              : "text-foreground bg-card border border-border/40 shadow-sm order-1 rounded-[20px] rounded-tl-[4px]"
          } ${
            isSearchMatch
              ? isActiveSearchMatch
                ? "ring-2 ring-amber-400"
                : "ring-1 ring-amber-300/70"
              : ""
          } ${
            isPrivateMessage ? "border border-dashed border-amber-400/60" : ""
          }`}
        >
          {isPrivateMessage && (
            <span className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
              isOwnMessage ? "text-primary-foreground/80" : "text-amber-500"
            }`}>
              Only visible to you
            </span>
          )}
          {!isOwnMessage && isGroupChat && message?.sender?.username ? (
            <p className="text-[11px] font-semibold text-primary mb-1">
              {message.sender.username}
            </p>
          ) : null}

          {message.attachments?.length ? (
            <div className="flex gap-2 flex-wrap mb-2 mt-1">
              {message.attachments?.map((file, idx) => (
                <div key={idx} className="flex flex-col bg-black/10 dark:bg-white/5 rounded-xl p-1 backdrop-blur-sm">
                  <div>
                    {(() => {
                      const attachmentUrl = typeof file === "string" ? file : file?.url || "";
                      const fileName = attachmentUrl.split("/").pop() || "attachment";
                      const fileExtension = (fileName.split(".").pop() || "").toLowerCase();
                      const isImage = ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(fileExtension);

                      if (!attachmentUrl) {
                        return (
                          <div className={`flex flex-col items-center justify-center p-4 ${isOwnMessage ? "text-primary-foreground" : "text-foreground"}`}>
                            <FaFile className="text-3xl opacity-80 mb-2" />
                            <p className="text-sm font-medium">Attachment unavailable</p>
                          </div>
                        );
                      }

                      if (isImage) {
                        return (
                          <img
                            src={attachmentUrl}
                            loading="lazy"
                            alt="attachment"
                            className={`${message.attachments?.length > 1 ? "w-36 h-36" : "w-64 h-64 md:w-56 md:h-56"} object-cover rounded-lg shadow-sm`}
                          />
                        );
                      } else {
                        return (
                          <div className={`flex flex-col items-center justify-center p-4 ${isOwnMessage ? "text-primary-foreground" : "text-foreground"}`}>
                            <FaFile className="text-3xl opacity-80 mb-2" />
                            <p className="text-sm font-medium">
                              {limitChar(fileName, 18)}
                            </p>
                          </div>
                        );
                      }
                    })()}
                    {isOpenView && (
                      <ViewImage
                        openView={isOpenView}
                        setOpenView={setIsOpenView}
                        imageUrl={currentImageUrl}
                      />
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2 px-2 pb-1">
                    <button
                      type="button"
                      aria-label="View attachment"
                      data-tooltip="View"
                      className="hci-tooltip cursor-pointer hover:scale-110 transition-transform"
                      onClick={() => {
                        const attachmentUrl = typeof file === "string" ? file : file?.url;
                        if (attachmentUrl) handleEnlargeClick(attachmentUrl);
                      }}
                    >
                      <ImEnlarge2 className={isOwnMessage ? "text-primary-foreground/90" : "text-muted-foreground hover:text-foreground"} />
                    </button>
                    <button
                      type="button"
                      aria-label="Download attachment"
                      data-tooltip="Download"
                      className="hci-tooltip cursor-pointer hover:scale-110 transition-transform"
                      onClick={() => {
                        const attachmentUrl = typeof file === "string" ? file : file?.url;
                        if (!attachmentUrl) return;
                        const filename = attachmentUrl.split("/").slice(-1)[0] || "attachment";
                        saveAs(attachmentUrl, filename);
                      }}
                    >
                      <PiDownloadSimpleBold className={`text-lg ${isOwnMessage ? "text-primary-foreground/90" : "text-muted-foreground hover:text-foreground"}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          
          <div className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
            {isEditingMessage ? (
              <textarea
                value={editedContent}
                onChange={(event) => setEditedContent(event.target.value)}
                rows={2}
                className={`w-full rounded-lg px-2 py-1 text-sm resize-none outline-none border ${
                  isOwnMessage
                    ? "bg-primary/20 border-primary-foreground/30 text-primary-foreground"
                    : "bg-muted/40 border-border text-foreground"
                }`}
              />
            ) : shouldRenderMarkdown ? (
              <ReactMarkdown
                className="prose prose-sm max-w-none text-inherit whitespace-pre-wrap"
                components={{
                  p: ({ node, ...props }) => <p className="m-0" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-5 m-0" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 m-0" {...props} />,
                  code: ({ node, inline, ...props }) =>
                    inline ? (
                      <code className="rounded bg-muted/60 px-1 py-0.5" {...props} />
                    ) : (
                      <code className="block rounded-lg bg-muted/60 p-2 whitespace-pre-wrap" {...props} />
                    ),
                }}
              >
                {message.content || ""}
              </ReactMarkdown>
            ) : (
              message.content
            )}
          </div>

          {isEditingMessage && (
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditingMessage(false);
                  setEditedContent(message?.content || "");
                }}
                className={`text-[11px] font-semibold px-2 py-1 rounded-md ${
                  isOwnMessage
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const normalizedContent = editedContent.trim();
                  if (!normalizedContent) return;

                  await editChatMessage(message._id, normalizedContent);
                  setIsEditingMessage(false);
                }}
                className={`text-[11px] font-semibold px-2 py-1 rounded-md ${
                  isOwnMessage
                    ? "bg-primary-foreground text-primary"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                Save
              </button>
            </div>
          )}

          {!!reactionSummary.length && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {reactionSummary.map((reaction) => (
                <button
                  key={reaction.emoji}
                  type="button"
                  onClick={() => toggleReactionOnMessage(message._id, reaction.emoji)}
                  className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors ${
                    reaction.reactedByCurrentUser
                      ? "bg-primary/20 border-primary/40 text-primary"
                      : isOwnMessage
                      ? "bg-primary-foreground/15 border-primary-foreground/30 text-primary-foreground"
                      : "bg-muted/60 border-border text-foreground"
                  }`}
                >
                  {reaction.emoji} {reaction.count}
                </button>
              ))}
            </div>
          )}

          <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-medium pt-1 opacity-70`}>
            <span>
              {moment(message.createdAt).format("hh:mm A")}
            </span>
            {message?.edited && <span>(edited)</span>}
          </div>
        </div>

        {/* Options Menu */}
        <div className={`flex items-center px-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwnMessage ? "order-1" : "order-2"}`}>
          <div
            ref={messageMenuRef}
            className="relative cursor-pointer text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors"
          >
              <button
                type="button"
                aria-label="Message options"
                data-tooltip="Options"
                className="hci-tooltip"
                onClick={() => setShowMessageMenu(!showMessageMenu)}
              >
                <BsThreeDotsVertical className="text-lg" />
              </button>
              {showMessageMenu && (
                <div className="absolute top-8 z-50 w-32 bg-popover border border-border shadow-lg rounded-xl p-1 text-sm text-popover-foreground right-0 md:-left-12">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(message.content);
                      setShowMessageMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors font-medium"
                  >
                    Copy
                  </button>
                  {user?._id === message?.sender?._id && (
                    <button
                      onClick={() => {
                        setIsEditingMessage(true);
                        setShowMessageMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors font-medium mt-1"
                    >
                      Edit
                    </button>
                  )}
                  <div className="px-2 pt-1 pb-1 mt-1 border-t border-border/60">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 px-1">
                      React
                    </p>
                    <div className="flex items-center gap-1">
                      {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            toggleReactionOnMessage(message._id, emoji);
                            setShowMessageMenu(false);
                          }}
                          className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  {user?._id === message?.sender?._id && (
                    <button
                      onClick={() => deleteChatMessage(message._id)}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors font-medium mt-1"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ChatsSection() {
  const {
    messages,
    currentSelectedChat,
    loadingMessages,
    sendingMessage,
    messageError,
    setMessageError,
    message,
    setMessage,
    setMessages,
    sendChatMessage,
    attachments,
    setAttachments,
    removeFileFromAttachments,
    summary,
    setSummary,
    isSummarizing,
    summaryError,
    setSummaryError,
    cancelSummaryRequest,
    summarizeCurrentChat,
    deleteUserChat,
    setIsChatSelected,
    resetUnreadCount,
    isChatTyping,
    aiStreamByChat,
  } = useChat();
  const { user } = useAuth();
  const { socket, socketEvents } = useSocket();

  const safeMessages = useMemo(() => {
    if (!Array.isArray(messages)) return [];

    return messages.filter((msg) => {
      if (!msg || !msg._id) return false;
      if (!msg.visibleOnlyTo) return true;
      return msg.visibleOnlyTo?.toString?.() === user?._id?.toString?.();
    });
  }, [messages, user?._id]);

  const { suggestions, isGenerating, clearSuggestions } = useSmartReplies(
    safeMessages,
    user?._id
  );
  const [isPrivateQuery, setIsPrivateQuery] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isSummaryCopied, setIsSummaryCopied] = useState(false);
  const [summaryGeneratedAt, setSummaryGeneratedAt] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [serverMatchedMessageIds, setServerMatchedMessageIds] = useState([]);
  const [isServerSearching, setIsServerSearching] = useState(false);
  const [serverSearchError, setServerSearchError] = useState(null);
  const [serverSearchPage, setServerSearchPage] = useState(1);
  const [serverSearchTotalPages, setServerSearchTotalPages] = useState(0);
  const [serverSearchTotalMatches, setServerSearchTotalMatches] = useState(0);

  const opponentParticipant = getOpponentParticipant(
    currentSelectedChat.current?.participants,
    user?._id
  );

  const opponentUsername = opponentParticipant?.username;
  const opponentProfilePictureUrl = opponentParticipant?.avatarUrl;
  const isGroupChat = !!currentSelectedChat.current?.isGroupChat;
  const selectedChatId = currentSelectedChat.current?._id;
  const isTypingInSelectedChat = isChatTyping(selectedChatId);
  const streamingEntry = selectedChatId ? aiStreamByChat?.[selectedChatId] : null;
  const isStreaming = Boolean(streamingEntry?.text);
  const normalizedInput = message.trim().toLowerCase();
  const hasAiTrigger =
    normalizedInput.startsWith("/ai") ||
    normalizedInput.includes("@ai") ||
    normalizedInput.includes("@ai assistant");

  const scrollToBottomRef = useRef(null);
  const searchInputRef = useRef(null);
  const messageNodeRefs = useRef({});
  const searchStateByChatRef = useRef({});
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const scrollToBottom = () => {
    scrollToBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const { handleCall, setTargetUserId, targetUserId } = useConnectWebRtc();

  const handlePrivateSend = useCallback(() => {
    sendChatMessage({ isPrivateQuery });

    if (isPrivateQuery) {
      setIsPrivateQuery(false);
    }
  }, [sendChatMessage, isPrivateQuery]);

  const {
    canSend,
    handleInputChange,
    handleAttachmentChange,
    handleInputKeyDown,
    handleSendClick,
  } = useMessageComposer({
    message,
    setMessage,
    attachments,
    setAttachments,
    sendingMessage,
    messageError,
    setMessageError,
    sendChatMessage: handlePrivateSend,
  });

  const matchedMessageIds = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return [];

    const shouldUseServerResults =
      normalizedQuery.length >= 2 && !serverSearchError;

    if (shouldUseServerResults) {
      return serverMatchedMessageIds;
    }

    return safeMessages
      .filter((msg) => {
        const content = (msg?.content || "").toLowerCase();
        return content.includes(normalizedQuery);
      })
      .map((msg) => msg._id?.toString())
      .filter(Boolean);
  }, [safeMessages, searchQuery, serverMatchedMessageIds, serverSearchError]);

  const activeMatchMessageId = matchedMessageIds[activeMatchIndex] || null;

  const goToNextMatch = () => {
    if (!matchedMessageIds.length) return;

    setActiveMatchIndex((prevIndex) =>
      prevIndex >= matchedMessageIds.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToPreviousMatch = () => {
    if (!matchedMessageIds.length) return;

    setActiveMatchIndex((prevIndex) =>
      prevIndex <= 0 ? matchedMessageIds.length - 1 : prevIndex - 1
    );
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setActiveMatchIndex(0);
    setServerMatchedMessageIds([]);
    setServerSearchError(null);
    setServerSearchPage(1);
    setServerSearchTotalPages(0);
    setServerSearchTotalMatches(0);
  };

  const emitStopTyping = () => {
    if (!socket || !selectedChatId || !isTypingRef.current) return;

    socket.emit(socketEvents.STOP_TYPING_EVENT, selectedChatId);
    isTypingRef.current = false;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const scheduleStopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping();
    }, 1200);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      emitStopTyping();
    };
  }, [socket, selectedChatId]);

  const handleCallButtonClick = async () => {
    if (opponentParticipant?._id) {
      setTargetUserId(opponentParticipant?._id);
    }
  };

  const handleSummarizeClick = async () => {
    if (!currentSelectedChat.current?._id) return;

    setSummary("");
    setSummaryError(null);
    setSummaryGeneratedAt(null);
    setIsSummaryModalOpen(true);
    await summarizeCurrentChat(currentSelectedChat.current?._id);
  };

  const closeSummaryModal = () => {
    if (isSummarizing) {
      cancelSummaryRequest();
    }
    setIsSummaryModalOpen(false);
  };

  const handleCopySummary = async () => {
    if (!summary) return;

    try {
      await navigator.clipboard.writeText(summary);
      setIsSummaryCopied(true);
    } catch (error) {
      setSummaryError("Unable to copy summary right now");
    }
  };

  useEffect(() => {
    if (targetUserId) {
      handleCall();
    }
  }, [targetUserId]);

  useEffect(() => {
    setActiveMatchIndex(0);
    setServerSearchPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedChatId) return;

    const cachedState = searchStateByChatRef.current[selectedChatId];
    if (!cachedState) {
      setIsSearchOpen(false);
      setSearchQuery("");
      setActiveMatchIndex(0);
      setServerMatchedMessageIds([]);
      setServerSearchError(null);
      setServerSearchPage(1);
      setServerSearchTotalPages(0);
      setServerSearchTotalMatches(0);
      return;
    }

    setIsSearchOpen(Boolean(cachedState.isSearchOpen));
    setSearchQuery(cachedState.searchQuery || "");
    setActiveMatchIndex(cachedState.activeMatchIndex || 0);
    setServerSearchPage(cachedState.serverSearchPage || 1);
    setServerSearchTotalPages(cachedState.serverSearchTotalPages || 0);
    setServerSearchTotalMatches(cachedState.serverSearchTotalMatches || 0);
  }, [selectedChatId]);

  useEffect(() => {
    if (!selectedChatId) return;

    searchStateByChatRef.current[selectedChatId] = {
      isSearchOpen,
      searchQuery,
      activeMatchIndex,
      serverSearchPage,
      serverSearchTotalPages,
      serverSearchTotalMatches,
    };
  }, [
    selectedChatId,
    isSearchOpen,
    searchQuery,
    activeMatchIndex,
    serverSearchPage,
    serverSearchTotalPages,
    serverSearchTotalMatches,
  ]);

  useEffect(() => {
    if (!isSearchOpen) {
      setServerMatchedMessageIds([]);
      setServerSearchError(null);
      setIsServerSearching(false);
      setServerSearchTotalPages(0);
      setServerSearchTotalMatches(0);
      return;
    }

    const normalizedQuery = searchQuery.trim();
    if (!selectedChatId || normalizedQuery.length < 2) {
      setServerMatchedMessageIds([]);
      setServerSearchError(null);
      setIsServerSearching(false);
      setServerSearchTotalPages(0);
      setServerSearchTotalMatches(0);
      return;
    }

    let isCancelled = false;
    const timerId = window.setTimeout(async () => {
      setIsServerSearching(true);
      setServerSearchError(null);

      try {
        const response = await searchChatMessages(selectedChatId, normalizedQuery, {
          page: serverSearchPage,
          limit: 100,
        });

        if (isCancelled) return;

        const ids = response?.data?.data?.messageIds || [];
        const totalPages = response?.data?.data?.totalPages || 0;
        const totalMatches = response?.data?.data?.total || 0;
        setServerMatchedMessageIds(Array.isArray(ids) ? ids : []);
        setServerSearchTotalPages(Number(totalPages) || 0);
        setServerSearchTotalMatches(Number(totalMatches) || 0);
      } catch (error) {
        if (isCancelled) return;

        setServerMatchedMessageIds([]);
        setServerSearchTotalPages(0);
        setServerSearchTotalMatches(0);
        setServerSearchError("Using local search fallback");
      } finally {
        if (!isCancelled) {
          setIsServerSearching(false);
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      window.clearTimeout(timerId);
    };
  }, [isSearchOpen, searchQuery, selectedChatId, serverSearchPage]);

  useEffect(() => {
    if (!isSearchOpen) return;

    if (!searchInputRef.current) return;
    searchInputRef.current.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    if (!activeMatchMessageId) return;

    const messageNode = messageNodeRefs.current[activeMatchMessageId];
    if (!messageNode) return;

    messageNode.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeMatchMessageId]);

  useEffect(() => {
    if (!hasAiTrigger && isPrivateQuery) {
      setIsPrivateQuery(false);
    }
  }, [hasAiTrigger, isPrivateQuery]);

  useEffect(() => {
    scrollToBottom();
  }, [safeMessages]);

  useEffect(() => {
    if (messageError) setMessageError(null);
    if (summaryError) setSummaryError(null);
    setSummary("");
    setSummaryGeneratedAt(null);
    setIsSummaryModalOpen(false);
    setIsSummaryCopied(false);
    resetUnreadCount(currentSelectedChat.current?._id);
    // We intentionally clear stale chat errors only when selected chat changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSelectedChat.current?._id]);

  useEffect(() => {
    if (!isSummaryModalOpen) return;

    const handleEscapeClose = (event) => {
      if (event.key === "Escape") {
        closeSummaryModal();
      }
    };

    window.addEventListener("keydown", handleEscapeClose);
    return () => window.removeEventListener("keydown", handleEscapeClose);
  }, [isSummaryModalOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;

    const handleSearchShortcuts = (event) => {
      if (event.key === "Escape") {
        closeSearch();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();

        if (event.shiftKey) {
          goToPreviousMatch();
        } else {
          goToNextMatch();
        }
      }
    };

    window.addEventListener("keydown", handleSearchShortcuts);
    return () => window.removeEventListener("keydown", handleSearchShortcuts);
  }, [isSearchOpen, matchedMessageIds.length]);

  useEffect(() => {
    if (!isSummaryCopied) return;

    const timeoutId = window.setTimeout(() => {
      setIsSummaryCopied(false);
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [isSummaryCopied]);

  useEffect(() => {
    if (isSummarizing) return;

    if (summary && !summaryError) {
      setSummaryGeneratedAt(new Date());
    }
  }, [summary, summaryError, isSummarizing]);

  const chatTimeline = useMemo(() => {
    const timeline = [];
    let previousDateKey = "";

    safeMessages.forEach((msg) => {
      const dateKey = moment(msg.createdAt).format("YYYY-MM-DD");

      if (dateKey !== previousDateKey) {
        timeline.push({
          type: "date",
          key: `date-${dateKey}`,
          label: moment(msg.createdAt).calendar(null, {
            sameDay: "[Today]",
            lastDay: "[Yesterday]",
            lastWeek: "dddd",
            sameElse: "DD MMM YYYY",
          }),
        });
        previousDateKey = dateKey;
      }

      timeline.push({
        type: "message",
        key: msg._id,
        message: msg,
      });
    });

    return timeline;
  }, [safeMessages]);

  const loadingMessageSkeletonRows = [1, 2, 3, 4, 5, 6];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Top Header */}
      <div className="flex w-full items-center justify-between p-4 px-6 md:px-4 glass-panel border-b border-border/50 shadow-sm z-10 shrink-0">
        <div className="flex gap-4 items-center">
          <button
            type="button"
            aria-label="Back to chats"
            data-tooltip="Back"
            data-tooltip-pos="bottom"
            className="hci-tooltip cursor-pointer p-3 -ml-3 rounded-full hover:bg-muted transition-colors block md:hidden"
            onClick={() => {
              currentSelectedChat.current = null;
              setMessages([]);
              setIsChatSelected(false);
            }}
          >
            <MdArrowBackIos className="text-foreground text-xl translate-x-1" />
          </button>
          
          {isGroupChat ? (
            <div className="relative w-16 h-10 flex-shrink-0 flex items-center">
              {(currentSelectedChat.current?.participants || []).slice(0, 3).map((participant, i) => (
                <UserAvatar
                  key={participant._id}
                  src={participant.avatarUrl}
                  alt={participant?.username || "participant"}
                  sizeClass="w-10 h-10"
                  className={`border-2 border-background absolute shadow-sm ${
                    i === 0 ? "left-0 z-30" : i === 1 ? "left-4 z-20" : i === 2 ? "left-8 z-10" : ""
                  }`}
                />
              ))}
            </div>
          ) : (
            <div className="relative">
              {opponentParticipant ? (
                <UserAvatar
                  sizeClass="w-11 h-11"
                  className="shadow-sm ring-2 ring-primary/20"
                  src={opponentProfilePictureUrl}
                  alt={opponentUsername || "User"}
                  loading="lazy"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-muted animate-pulse ring-2 ring-border/60" />
              )}
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background"></span>
            </div>
          )}

          <div className="flex flex-col">
            <h3 className="font-semibold text-lg text-foreground tracking-tight leading-tight">
              {isGroupChat
                ? currentSelectedChat.current.name
                : opponentUsername || "Loading chat..."}
            </h3>
            <span className="text-xs text-muted-foreground font-medium">
              {isGroupChat
                ? `${(currentSelectedChat.current?.participants || []).length} members`
                : isTypingInSelectedChat
                ? "Typing..."
                : opponentParticipant
                ? "Active now"
                : "Fetching participant"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <button
            type="button"
            aria-label="Summarize chat"
            data-tooltip="Summarize chat"
            data-tooltip-pos="bottom"
            className="hci-tooltip inline-flex items-center gap-2 px-3 py-2 rounded-full border border-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 hover:from-amber-100 hover:to-orange-100 transition-all dark:border-amber-900/50 dark:from-amber-950/60 dark:to-orange-950/40 dark:text-amber-200 dark:hover:from-amber-950/80 dark:hover:to-orange-950/60"
            onClick={handleSummarizeClick}
          >
            {isSummarizing ? (
              <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <BsStars className="text-sm" />
            )}
            <span className="hidden sm:inline text-xs font-semibold">
              {isSummarizing ? "Refreshing" : "Summarize"}
            </span>
          </button>

          <button
            type="button"
            aria-label="Search in chat"
            data-tooltip="Search"
            data-tooltip-pos="bottom"
            className="hci-tooltip inline-flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-muted hover:text-foreground transition-all"
            onClick={() => setIsSearchOpen((prev) => !prev)}
          >
            <BiSearch className="text-xl" />
            <span className="hidden sm:inline text-xs font-semibold">Search</span>
          </button>
          
          {!isGroupChat && (
            <button
              type="button"
              aria-label="Start video call"
              data-tooltip="Video call"
              data-tooltip-pos="bottom"
              disabled={!opponentParticipant}
              className="hci-tooltip inline-flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-muted hover:text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCallButtonClick}
            >
              <IoVideocamOutline className="text-xl" />
              <span className="hidden sm:inline text-xs font-semibold">Call</span>
            </button>
          )}

          {(!isGroupChat || currentSelectedChat.current?.admin?.toString() === user?._id) && (
            <button 
              type="button"
              aria-label="Delete chat"
              data-tooltip="Delete chat"
              data-tooltip-pos="bottom"
              className="hci-tooltip inline-flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-destructive/10 text-destructive transition-all"
              onClick={() => deleteUserChat(currentSelectedChat.current?._id)}
            >
              <MdDeleteOutline className="text-xl" />
              <span className="hidden sm:inline text-xs font-semibold">Delete</span>
            </button>
          )}
        </div>
      </div>

      {isSearchOpen && (
        <div className="px-6 md:px-4 py-3 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex-1 flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-2">
            <BiSearch className="text-muted-foreground text-lg" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search messages in this chat"
              className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <span className="text-xs text-muted-foreground min-w-24 text-right">
              {isServerSearching
                ? "Searching..."
                : matchedMessageIds.length
                ? `${activeMatchIndex + 1}/${matchedMessageIds.length} matches`
                : searchQuery.trim()
                ? "No matches"
                : "Type to search"}
            </span>

            {searchQuery.trim().length >= 2 && !serverSearchError && (
              <span className="text-xs text-muted-foreground min-w-16 text-right">
                Page {serverSearchTotalPages ? serverSearchPage : 0}/
                {serverSearchTotalPages}
              </span>
            )}

            {searchQuery.trim().length >= 2 && !serverSearchError && (
              <span className="text-xs text-muted-foreground min-w-20 text-right">
                Total {serverSearchTotalMatches}
              </span>
            )}

            {!!serverSearchError && (
              <span className="text-[11px] text-amber-600 font-medium">
                {serverSearchError}
              </span>
            )}

            <button
              type="button"
              onClick={goToPreviousMatch}
              disabled={!matchedMessageIds.length}
              className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>

            <button
              type="button"
              onClick={goToNextMatch}
              disabled={!matchedMessageIds.length}
              className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>

            <button
              type="button"
              onClick={closeSearch}
              className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted"
            >
              Close
            </button>

            {searchQuery.trim().length >= 2 && !serverSearchError && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setServerSearchPage((prevPage) => Math.max(1, prevPage - 1))
                  }
                  disabled={
                    isServerSearching ||
                    serverSearchTotalPages <= 1 ||
                    serverSearchPage <= 1
                  }
                  className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev page
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setServerSearchPage((prevPage) =>
                      Math.min(
                        serverSearchTotalPages || prevPage,
                        prevPage + 1
                      )
                    )
                  }
                  disabled={
                    isServerSearching ||
                    serverSearchTotalPages <= 1 ||
                    serverSearchPage >= serverSearchTotalPages
                  }
                  className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next page
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl rounded-3xl border border-border/60 bg-card shadow-2xl overflow-hidden animate-fade-in relative">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-amber-500/10" />

            {isSummaryCopied && (
              <div className="absolute right-5 top-4 z-20 rounded-full px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-white shadow-lg animate-fade-in">
                Summary copied
              </div>
            )}

            <div className="relative px-5 py-4 md:px-6 md:py-5 border-b border-border/60 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                  <BsStars className={`${isSummarizing ? "animate-pulse" : ""}`} />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground">
                    Smart Thread Summary
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Quick highlights from your latest conversation context.
                  </p>
                  {!isSummarizing && !!summaryGeneratedAt && !summaryError && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Generated {moment(summaryGeneratedAt).format("hh:mm A")}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                aria-label="Close summary modal"
                className="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={closeSummaryModal}
              >
                <RxCross2 className="text-lg" />
              </button>
            </div>

            <div className="relative px-5 py-5 md:px-6 md:py-6 max-h-[65vh] overflow-y-auto">
              {isSummarizing ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    Building summary
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 rounded-full bg-muted animate-pulse w-[92%]" />
                    <div className="h-4 rounded-full bg-muted animate-pulse w-[88%]" />
                    <div className="h-4 rounded-full bg-muted animate-pulse w-[84%]" />
                    <div className="h-4 rounded-full bg-muted animate-pulse w-[72%]" />
                  </div>
                </div>
              ) : summaryError ? (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 animate-fade-in">
                  <p className="text-sm font-semibold text-destructive">Summary unavailable</p>
                  <p className="text-sm text-destructive/90 mt-1">{summaryError}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4 md:p-5 shadow-sm animate-fade-in">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                    Conversation digest
                  </p>
                  <p className="text-sm md:text-[15px] leading-7 text-foreground whitespace-pre-wrap">
                    {summary || "No summary generated yet."}
                  </p>
                </div>
              )}
            </div>

            <div className="relative px-5 py-4 md:px-6 border-t border-border/60 flex justify-end gap-2 bg-card/60 backdrop-blur-sm">
              {!isSummarizing && !summaryError && !!summary && (
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted/70 transition-colors"
                  onClick={handleCopySummary}
                >
                  {isSummaryCopied ? "Copied" : "Copy summary"}
                </button>
              )}

              {!isSummarizing && !!summaryError && (
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  onClick={handleSummarizeClick}
                >
                  Try again
                </button>
              )}

              {isSummarizing && (
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted/70 transition-colors"
                  onClick={cancelSummaryRequest}
                >
                  Cancel
                </button>
              )}

              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors"
                onClick={closeSummaryModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="chat-msg-cont flex-1 overflow-y-auto px-6 py-4 md:px-4 chat-wallpaper shadow-inner relative z-0">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/20" />
        {loadingMessages ? (
          <div className="h-full w-full relative z-10">
            <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Loading />
              <span className="font-medium">Loading conversation...</span>
            </div>
            <div className="space-y-3">
              {loadingMessageSkeletonRows.map((row) => (
                <div
                  key={row}
                  className={`flex ${row % 2 === 0 ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`h-12 rounded-2xl animate-pulse bg-muted/70 border border-border/50 ${
                      row % 2 === 0
                        ? "w-[45%] rounded-tr-[6px]"
                        : "w-[60%] rounded-tl-[6px]"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : !safeMessages.length ? (
          <div className="h-full w-full flex flex-col items-center justify-center gap-3 relative z-10">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
              <IoMdSend className="text-3xl text-muted-foreground/50 ml-1" />
            </div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Say Hello!</h1>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              This is the beginning of your conversation with {opponentUsername || "this group"}.
            </p>
          </div>
        ) : (
          <div className="flex flex-col justify-end min-h-full relative z-10">
            {chatTimeline.map((item) =>
              item.type === "date" ? (
                <div key={item.key} className="flex justify-center my-3">
                  <span className="text-[11px] px-3 py-1 rounded-full bg-background/80 border border-border/60 text-muted-foreground shadow-sm">
                    {item.label}
                  </span>
                </div>
              ) : (
                <div
                  key={item.key}
                  ref={(node) => {
                    if (!node) return;
                    messageNodeRefs.current[item.message._id?.toString()] = node;
                  }}
                >
                  <MessageCont
                    isOwnMessage={item.message.sender?._id === user?._id}
                    isGroupChat={currentSelectedChat.current?.isGroupChat}
                    message={item.message}
                    isSearchMatch={matchedMessageIds.includes(
                      item.message._id?.toString()
                    )}
                    isActiveSearchMatch={
                      activeMatchMessageId === item.message._id?.toString()
                    }
                  />
                </div>
              )
            )}
            {isStreaming && (
              <MessageCont
                isOwnMessage={streamingEntry?.senderId === user?._id}
                isGroupChat={currentSelectedChat.current?.isGroupChat}
                message={{
                  _id: "ai-stream",
                  content: streamingEntry?.text || "",
                  contentFormat: "markdown",
                  visibleOnlyTo: streamingEntry?.isPrivateQuery
                    ? user?._id
                    : null,
                  createdAt: new Date(),
                  sender: {
                    _id: streamingEntry?.senderId,
                    isAI: true,
                  },
                }}
              />
            )}
            <div ref={scrollToBottomRef} className="h-2" />
          </div>
        )}
      </div>

      {/* Attachments Preview */}
      {!!attachments.length && (
        <div className="px-6 py-3 bg-muted/30 border-t border-border/50 flex gap-3 overflow-x-auto shrink-0 shadow-[inset_0_4px_6px_-1px_rgba(0,0,0,0.05)]">
          {attachments?.map((file, index) => (
            <div
              key={index}
              className="relative w-20 h-20 bg-background rounded-xl border border-border shadow-sm flex flex-col items-center justify-center flex-shrink-0 overflow-hidden group"
            >
              <button
                className="hci-tooltip absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-destructive"
                type="button"
                aria-label="Remove attachment"
                data-tooltip="Remove"
                onClick={() => removeFileFromAttachments(index)}
              >
                <RxCross2 className="text-xs" />
              </button>
              {file.type.startsWith("image/") ? (
                <img
                  className="w-full h-full object-cover"
                  src={URL.createObjectURL(file)}
                  alt="preview"
                />
              ) : (
                <div className="flex flex-col items-center p-2">
                  <FaFile className="text-xl text-primary mb-1" />
                  <p className="text-[9px] text-muted-foreground font-medium text-center truncate w-full px-1">
                    {file.name}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Smart Replies Overlay */}
      {(!message || message === "") && (isGenerating || suggestions.length > 0) && (
        <div className="px-6 py-2 pt-0 -mb-2 flex gap-2 overflow-x-auto no-scrollbar shrink-0 z-20 transition-all duration-300 animate-fade-in items-center">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mr-1">
            Smart replies
          </span>
          <div className="flex items-center justify-center p-2 rounded-full bg-primary/10 text-primary shrink-0 shadow-sm">
             <BsStars className={isGenerating ? "animate-spin" : "animate-pulse"} />
          </div>
          {isGenerating ? (
            <div className="flex items-center px-4 py-1.5 rounded-full bg-muted/50 border border-border/50 shadow-sm gap-1.5">
               <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{animationDelay: "0ms"}} />
               <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{animationDelay: "150ms"}} />
               <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{animationDelay: "300ms"}} />
            </div>
          ) : (
            suggestions.map((suggestion, idx) => (
              <button 
                key={idx} 
                onClick={() => {
                   setMessage(suggestion);
                   clearSuggestions();
                }}
                className="px-4 py-1.5 rounded-full bg-background border border-primary/30 text-primary shadow-sm text-xs font-semibold hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all shrink-0 active:scale-95"
              >
                {suggestion}
              </button>
            ))
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 px-4 md:px-6 shrink-0 bg-background/95 backdrop-blur-xl border-t border-border/40 z-20 flex flex-col justify-end transition-all duration-300 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        {!!messageError && (
          <div className="mb-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 flex items-center gap-2">
            <span className="text-destructive font-semibold text-sm">Error:</span>
            <p className="text-sm text-destructive">{messageError}</p>
          </div>
        )}
        
        <div className="flex items-center gap-3 w-full max-w-5xl mx-auto">
          {/* Attachment Buttons */}
          <div className="flex items-center gap-1">
            <label
              htmlFor="imageAttach"
              aria-label="Attach image"
              data-tooltip="Attach image"
              className="hci-tooltip cursor-pointer p-2.5 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            >
              <FiImage className="text-xl" />
            </label>
            <input type="file" accept="image/*" id="imageAttach" hidden max={5} multiple onChange={handleAttachmentChange} />
            
            <label
              htmlFor="fileAttach"
              aria-label="Attach file"
              data-tooltip="Attach file"
              className="hci-tooltip cursor-pointer p-2.5 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors hidden sm:block"
            >
              <IoMdAttach className="text-xl" />
            </label>
            <input type="file" id="fileAttach" hidden max={5} multiple onChange={handleAttachmentChange} />
          </div>

          {/* Text Input with Slash Commands Popup */}
          <div className="flex-1 bg-muted/50 border border-transparent rounded-[24px] focus-within:bg-background focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300 relative group flex items-center shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)]">
            
            {/* Float Menu for Slash Commands */}
            {showSlashCommands && (
              <div className="absolute bottom-[60px] left-0 w-64 bg-background border border-border rounded-xl shadow-2xl p-2 z-50 animate-fade-in flex flex-col">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-2 mt-1">AI Actions</h4>
                
                <div className="flex items-center gap-3 px-3 py-2 hover:bg-muted focus:bg-muted rounded-lg cursor-pointer transition-colors group" 
                  onClick={() => { setMessage("/summarize "); setShowSlashCommands(false); clearSuggestions(); }}>
                  <div className="bg-primary/10 group-hover:bg-primary/20 text-primary p-2 rounded-lg transition-colors"><BsStars className="text-lg"/></div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-foreground">/summarize</span>
                    <span className="text-[11px] text-muted-foreground font-medium">Summarize this chat</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 px-3 py-2 hover:bg-muted focus:bg-muted rounded-lg cursor-pointer transition-colors group"
                  onClick={() => { setMessage("/tone "); setShowSlashCommands(false); clearSuggestions(); }}>
                  <div className="bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-500 p-2 rounded-lg transition-colors"><BsLightningChargeFill className="text-lg"/></div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-foreground">/tone</span>
                    <span className="text-[11px] text-muted-foreground font-medium">Auto-rewrite respectfully</span>
                  </div>
                </div>
              </div>
            )}

            <input
              type="text"
              placeholder="Type a message or '/' for commands..."
              className="w-full h-12 px-5 bg-transparent border-none text-[15px] font-medium text-foreground focus:outline-none placeholder:text-muted-foreground/70"
              onKeyDown={(e) => {
                 if (e.key === "Escape") setShowSlashCommands(false);
                 handleInputKeyDown(e);
                 if (e.key === "Enter" && canSend) {
                   emitStopTyping();
                   clearSuggestions();
                   setShowSlashCommands(false);
                 }
              }}
              value={message}
              onChange={(e) => {
                 const val = e.target.value;
                 setShowSlashCommands(val === '/');
                 if (val !== '') clearSuggestions();

                 if (socket && selectedChatId) {
                   if (val.trim()) {
                     if (!isTypingRef.current) {
                       socket.emit(socketEvents.START_TYPING_EVENT, selectedChatId);
                       isTypingRef.current = true;
                     }

                     scheduleStopTyping();
                   } else {
                     emitStopTyping();
                   }
                 }

                 handleInputChange(e);
              }}
              autoComplete="off"
            />
          </div>

          {hasAiTrigger && (
            <button
              type="button"
              onClick={() => setIsPrivateQuery((prev) => !prev)}
              aria-label={isPrivateQuery ? "Disable private AI" : "Enable private AI"}
              data-tooltip={isPrivateQuery ? "Private view on" : "Private view off"}
              className={`hci-tooltip h-12 w-12 flex items-center justify-center rounded-full border transition-all duration-300 shrink-0 ${
                isPrivateQuery
                  ? "border-amber-400 bg-amber-500/10 text-amber-500"
                  : "border-border bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {isPrivateQuery ? <FiEyeOff className="text-xl" /> : <FiEye className="text-xl" />}
            </button>
          )}

          {/* Send Button */}
          <button
            disabled={!canSend}
            onClick={() => {
              emitStopTyping();
              handleSendClick();
            }}
            aria-label="Send message"
            data-tooltip="Send"
            className="hci-tooltip h-12 w-12 flex items-center justify-center bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 text-primary-foreground rounded-full shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none transition-all duration-300 active:scale-90 shrink-0 ml-2"
          >
            {sendingMessage ? (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{animationDelay: "0ms"}} />
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{animationDelay: "150ms"}} />
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{animationDelay: "300ms"}} />
              </span>
            ) : (
              <IoMdSend className="text-xl ml-1" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
