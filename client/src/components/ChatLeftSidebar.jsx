import React from "react";
import ProfileSidebar from "./ProfileSidebar";
import RecentChatsSidebar from "./RecentChatsSidebar";
import SearchUserSidebar from "./SearchUserSidebar";
import SideMenu from "./SideMenu";
import { useChat } from "../context/ChatContext";

export default function ChatLeftSidebar({ activeLeftSidebar }) {
  const { setActiveLeftSidebar } = useChat();

  const renderLeftSidebar = () => {
    switch (activeLeftSidebar) {
      case "profile":
        return <ProfileSidebar />;
      case "recentChats":
        return <RecentChatsSidebar />;
      case "searchUser":
        return <SearchUserSidebar />;
      default:
        return <ProfileSidebar />;
    }
  };

  return (
    <div className="w-[390px] max-w-[390px] md:max-w-full md:w-full h-full bg-background/40 dark:bg-background/10 border-r border-border/50 relative overflow-hidden glass-panel-dark">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent" />
      {renderLeftSidebar()}
    </div>
  );
}
