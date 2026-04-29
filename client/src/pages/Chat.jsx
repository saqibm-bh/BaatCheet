import React from "react";
import SideMenu from "../components/SideMenu";
import ChatLeftSidebar from "../components/ChatLeftSidebar";
import ChatsSection from "../components/ChatsSection";
import { AddChat } from "../components/AddChat";
import { useChat } from "../context/ChatContext";
import VideoChat from "../components/VideoChat";
import { useConnectWebRtc } from "../context/WebRtcContext";
import IncomingCall from "../components/IncomingCall";
import CommandPalette from "../components/CommandPalette";
import LogoMark from "../components/LogoMark";
import ChatErrorBoundary from "../components/ChatErrorBoundary";

export default function Chat() {
  const {
    currentSelectedChat,
    activeLeftSidebar,
    setActiveLeftSidebar,
    isChatSelected,
    setOpenAddChat,
  } = useChat();
  const { showVideoComp, incomingOffer } = useConnectWebRtc();

  return (
    <>
      <div className="h-full w-full">
        <CommandPalette />
        <AddChat open={true} />
        {!!incomingOffer && !showVideoComp && (
          <IncomingCall
            incomingOffer={incomingOffer}
            active={!!incomingOffer}
          />
        )}

        <VideoChat show={showVideoComp} />
        <div className="bg-background w-full h-[100dvh] flex relative animate-page-enter overflow-hidden pb-[84px] md:pb-0">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/[0.04] via-transparent to-transparent z-0" />

          <div className="hidden md:block h-full panel-edge-right z-40 bg-card/60 backdrop-blur-xl border-r border-border/50">
            <SideMenu
              setActiveLeftSidebar={setActiveLeftSidebar}
              activeLeftSidebar={activeLeftSidebar}
              mode="desktop"
              onCreateChat={() => setOpenAddChat(true)}
            />
          </div>

          <div
            className={`h-full panel-edge-right z-30 bg-card/60 backdrop-blur-xl border-r border-border/50 md:w-[30%] md:max-w-sm md:flex-shrink-0 ${
              isChatSelected ? "hidden md:block" : "block"
            }`}
          >
            <ChatLeftSidebar activeLeftSidebar={activeLeftSidebar} />
          </div>

          <div
            className={`w-full h-full flex-col relative md:flex md:flex-1 ${
              isChatSelected ? "flex" : "hidden"
            }`}
          >
            {currentSelectedChat.current?._id ? (
              <ChatErrorBoundary resetKey={currentSelectedChat.current?._id}>
                <ChatsSection />
              </ChatErrorBoundary>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground px-4 bg-muted/20 chat-wallpaper">
                <div className="bg-card/85 backdrop-blur-xl border border-border/50 shadow-2xl rounded-3xl px-10 py-10 text-center max-w-md mx-auto flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <LogoMark className="w-10 h-10 text-primary opacity-70" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">BaatCheet for Web</h1>
                  <p className="font-medium text-sm text-muted-foreground leading-relaxed">
                    Send and receive messages without keeping your phone online.
                    <br/><br/>
                    Use BaatCheet on up to 4 linked devices and 1 phone at the same time.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveLeftSidebar("searchUser");
                      setOpenAddChat(true);
                    }}
                    className="mt-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Start a new chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-3 inset-x-3 z-50">
        <SideMenu
          setActiveLeftSidebar={setActiveLeftSidebar}
          activeLeftSidebar={activeLeftSidebar}
          mode="mobile"
          onCreateChat={() => setOpenAddChat(true)}
        />
      </div>
    </>
  );
}
