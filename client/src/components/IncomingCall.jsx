import React, { useEffect, useState } from "react";
import { useChat } from "../context/ChatContext";
import { useConnectWebRtc } from "../context/WebRtcContext";
import { MdCallEnd, MdCall } from "react-icons/md";
import UserAvatar from "./UserAvatar";

export default function IncomingCall({ active, incomingOffer }) {
  const [offererUser, setOffererUser] = useState(null);
  const { currentUserChats } = useChat();
  const { handleAnswerOffer, handleHangup } = useConnectWebRtc();
  
  useEffect(() => {
    const res = currentUserChats?.flatMap((chat) =>
      chat.participants?.filter((p) => p._id === incomingOffer?.offererUserId)
    )[0];
    setOffererUser(res);
  }, [incomingOffer, currentUserChats]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in overflow-hidden">
      
      {/* Immersive Blur Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110"
        style={{
          backgroundImage: offererUser?.avatarUrl
            ? `url(${offererUser.avatarUrl})`
            : "linear-gradient(135deg, rgba(14,116,144,0.4), rgba(76,29,149,0.45))",
        }}
      />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />

      {/* Main Calling Card */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        
        {/* Pulsing Avatar */}
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-emerald-500/30 rounded-full animate-ping scale-[2] duration-1000"></div>
           <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping scale-[1.5] duration-700" style={{animationDelay: "500ms"}}></div>
           <UserAvatar
             sizeClass="w-32 h-32"
             className="border-4 border-white shadow-2xl relative z-10"
             src={offererUser?.avatarUrl}
             alt={offererUser?.username}
             fallbackClassName="bg-white/20 text-white border-white/60"
             iconClassName="text-[45%]"
           />
        </div>

        {/* User Info */}
        <h2 className="text-3xl font-bold text-white tracking-tight mb-2 drop-shadow-md">
          {offererUser?.username}
        </h2>
        <p className="text-sm font-medium text-white/70 uppercase tracking-widest mb-16 animate-pulse">Incoming Video Call...</p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-16 w-full px-8">
          
          <button
            onClick={handleHangup}
            className="group flex flex-col items-center gap-3"
          >
            <div className="w-[72px] h-[72px] rounded-full bg-destructive flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform active:scale-95">
              <MdCallEnd className="text-3xl text-white" />
            </div>
            <span className="text-xs font-semibold text-white/80 tracking-wider">End</span>
          </button>

          <button
            onClick={() => handleAnswerOffer(incomingOffer)}
            className="group flex flex-col items-center gap-3"
          >
            <div className="w-[72px] h-[72px] rounded-full bg-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform active:scale-95 animate-bounce">
              <MdCall className="text-3xl text-white" />
            </div>
            <span className="text-xs font-semibold text-white/80 tracking-wider">Accept</span>
          </button>

        </div>
      </div>
    </div>
  );
}
