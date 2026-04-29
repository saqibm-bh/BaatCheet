import React, { useEffect, useState } from "react";
import ProfileSidebar from "./ProfileSidebar";
import RecentChatsSidebar from "./RecentChatsSidebar";
import SearchUserSidebar from "./SearchUserSidebar";
import SideMenu from "./SideMenu";
import { useChat } from "../context/ChatContext";

export default function ChatLeftSidebar({ activeLeftSidebar }) {
  const { setActiveLeftSidebar } = useChat();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (activeLeftSidebar !== "recentChats") {
      setIsCollapsed(false);
    }
  }, [activeLeftSidebar]);

  const renderLeftSidebar = () => {
    switch (activeLeftSidebar) {
      case "profile":
        return <ProfileSidebar />;
      case "recentChats":
        return (
          <RecentChatsSidebar
            isCollapsed={isCollapsed}
            onToggleCollapse={(nextState) => {
              if (nextState && activeLeftSidebar !== "recentChats") {
                setActiveLeftSidebar("recentChats");
              }
              setIsCollapsed(nextState);
            }}
          />
        );
      case "searchUser":
        return <SearchUserSidebar />;
      default:
        return <ProfileSidebar />;
    }
  };

  return (
    <div
      className={`h-full bg-background/40 dark:bg-background/10 border-r border-border/50 relative overflow-hidden glass-panel-dark transition-[width] duration-200 w-full ${
        isCollapsed ? "md:w-[96px] md:max-w-[96px]" : "md:w-[30%] md:max-w-sm"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent" />
      {renderLeftSidebar()}
    </div>
  );
}
