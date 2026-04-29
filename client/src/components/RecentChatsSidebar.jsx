import React, { useEffect, useState } from "react";
import { BiSearch } from "../assets";
import { LocalStorage } from "../utils";
import { useChat } from "../context/ChatContext";
import RecentUserChatCard from "./RecentUserChatCard";
import { useAuth } from "../context/AuthContext";
import { FiPlus } from "react-icons/fi";
import UserAvatar from "./UserAvatar";

export default function RecentChatsSidebar() {
  const {
    currentUserChats,
    loadingChats,
    loadingMessages,
    sendingMessage,
    messageError,
    getCurrentUserChats,
    setMessages,
    getMessages,
    currentSelectedChat,
    isChatSelected,
    setIsChatSelected,
    setOpenAddChat,
    setActiveLeftSidebar,
    unreadCounts,
    resetUnreadCount,
  } = useChat();
  const { user } = useAuth();

  const [filteredRecentUserChats, setFilteredRecentUserChats] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatTypeFilter, setChatTypeFilter] = useState("all");

  const sortChatsByRecent = (chats = []) => {
    return [...chats].sort((a, b) => {
      const aTime =
        new Date(a?.updatedAt || a?.lastMessage?.createdAt || 0).getTime() || 0;
      const bTime =
        new Date(b?.updatedAt || b?.lastMessage?.createdAt || 0).getTime() || 0;
      return bTime - aTime;
    });
  };

  const getFilteredRecentChats = (sourceChats, query, typeFilter) => {
    const usernameRegex = new RegExp(query.trim(), "i");

    const scopedByType = sourceChats.filter((chat) => {
      if (typeFilter === "groups") return !!chat?.isGroupChat;
      if (typeFilter === "direct") return !chat?.isGroupChat;
      return true;
    });

    if (!query.trim()) return sortChatsByRecent(scopedByType);

    return sortChatsByRecent(
      scopedByType.filter((chat) => {
        if (chat?.isGroupChat) {
          return usernameRegex.test(chat.name || "");
        }

        return (chat.participants || []).some((participant) => {
          if (participant?._id === user?._id) return false;
          return usernameRegex.test(participant?.username || "");
        });
      })
    );
  };

  useEffect(() => {
    setFilteredRecentUserChats(
      getFilteredRecentChats(currentUserChats || [], searchQuery, chatTypeFilter)
    );
  }, [currentUserChats, searchQuery, chatTypeFilter]);

  useEffect(() => {
    // fetch the current user chats
    getCurrentUserChats();
  }, []);

  return (
    <div
      className={`px-5 py-6 md:p-4 w-full h-full flex flex-col bg-background/40 dark:bg-background/20 glass-panel md:${
        isChatSelected ? "hidden" : "block"
      }`}
    >
      <div className="flex-shrink-0 sticky top-0 z-10 bg-background/80 backdrop-blur-md pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-foreground font-semibold text-2xl tracking-tight">
              Recent chats
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Sorted by latest activity
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveLeftSidebar("searchUser");
                setOpenAddChat(true);
              }}
              data-tooltip="Create chat"
              data-tooltip-pos="bottom"
              className="hci-tooltip h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors"
              aria-label="Create chat"
            >
              <FiPlus className="text-sm" />
            </button>

            <div className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {currentUserChats?.length || 0} chats
            </div>
          </div>
        </div>
        
        {/* Subtle status indicator right below the header */}
        {(loadingMessages || sendingMessage || messageError) && (
          <p className="mt-1 text-xs text-muted-foreground animate-pulse flex items-center gap-1">
            {loadingMessages
              ? "Loading messages..."
              : sendingMessage
              ? "Sending message..."
              : <span className="text-destructive">{messageError}</span>}
          </p>
        )}

        <div className="flex items-center gap-2 bg-muted/40 border border-border/50 text-foreground p-2.5 rounded-xl my-4 transition-all focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/50 shadow-sm">
          <BiSearch className="text-muted-foreground text-xl" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none w-full text-sm placeholder:text-muted-foreground"
            placeholder="Search for chats..."
          />
        </div>

        <div className="flex items-center gap-2 mb-4">
          {[
            { key: "all", label: "All" },
            { key: "direct", label: "Direct" },
            { key: "groups", label: "Groups" },
          ].map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setChatTypeFilter(filter.key)}
              data-tooltip={`Filter: ${filter.label}`}
              data-tooltip-pos="bottom"
              className={`hci-tooltip px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                chatTypeFilter === filter.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        
        {/* Active Now Story Bar (Instagram Style) */}
        {!loadingChats && currentUserChats?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Active Now</h4>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
              {/* Derive unique friends from recent chats to populate stories */}
              {Array.from(new Set(
                currentUserChats
                  .flatMap(chat => chat.isGroupChat ? [] : chat.participants)
                  .filter(p => p && p._id !== user?._id)
                  .map(p => JSON.stringify(p))
              )).map(str => JSON.parse(str)).slice(0, 8).map((friend, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
                  <div className="relative">
                    <UserAvatar
                      src={friend?.avatarUrl}
                      alt={friend?.username || "User"} 
                      sizeClass="w-12 h-12"
                      className="p-[2px] ring-2 ring-primary/60 group-hover:ring-primary transition-all shadow-sm"
                      fallbackClassName="bg-primary/10 text-primary"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                  </div>
                  <span className="text-[10px] font-medium text-foreground max-w-[50px] truncate">
                    {(friend?.username || "User").split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-4 -mx-2 px-2">
        {loadingChats ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((row) => (
              <div
                key={row}
                className="flex items-center gap-3 px-3 py-3 rounded-2xl border border-border/40 bg-background/50"
              >
                <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                <div className="flex-1">
                  <div className="h-3.5 w-2/5 bg-muted rounded-full animate-pulse mb-2" />
                  <div className="h-3 w-4/5 bg-muted/80 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : currentUserChats?.length === 0 ? (
          <div className="flex justify-center items-center h-full min-h-[200px]">
            <h1 className="text-lg text-muted-foreground font-medium">
              No recent chats
            </h1>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {(filteredRecentUserChats || []).length ? (
              (filteredRecentUserChats || []).map((chat) => (
                <RecentUserChatCard
                  key={chat._id}
                  chat={chat}
                  isActive={currentSelectedChat.current?._id === chat._id}
                  onClick={(chat) => {
                    if (
                      currentSelectedChat.current?._id &&
                      currentSelectedChat.current?._id === chat?._id
                    )
                      return;
                    LocalStorage.set("currentSelectedChat", chat);
                    currentSelectedChat.current = chat;
                    setIsChatSelected(true);
                    setMessages([]);
                    resetUnreadCount(chat?._id);
                    getMessages(currentSelectedChat.current?._id);
                  }}
                  unreadCount={unreadCounts?.[chat._id] || 0}
                />
              ))
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No chats match your search.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
