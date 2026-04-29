import moment from "moment";
import { useAuth } from "../context/AuthContext";
import { getChatObjectMetadata, limitChar } from "../utils";
import UserAvatar from "./UserAvatar";

export default function RecentUserChatCard({
  chat,
  onClick,
  isActive,
  unreadCount = 0,
  onlineUserIds,
}) {
  const { user } = useAuth();
  const filteredChat = getChatObjectMetadata(chat, user);
  const opponentParticipant = chat?.isGroupChat
    ? null
    : (chat.participants || []).find(
        (participant) => participant?._id !== user?._id
      );
  const isOpponentOnline = opponentParticipant
    ? onlineUserIds?.has?.(opponentParticipant?._id)
    : false;
  const hasIncomingLastMessage =
    !!chat?.lastMessage?.sender?._id &&
    chat?.lastMessage?.sender?._id !== user?._id;
  const messagePrefix =
    chat?.lastMessage?.sender?._id === user?._id ? "You: " : "";

  return (
    <div
      onClick={() => onClick(chat)}
      className={`flex gap-3 px-3 py-3 my-0.5 rounded-2xl cursor-pointer transition-all duration-200 group relative ${
        isActive
          ? "bg-primary/10 shadow-sm border border-primary/20"
          : "hover:bg-muted/60 border border-transparent hover:border-border/40"
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {chat.isGroupChat ? (
          <div className="w-12 h-12 relative flex-shrink-0">
            {chat.participants.slice(0, 2).map((participant, i) => (
              <UserAvatar
                key={participant?._id || `${chat._id}-${i}`}
                src={participant?.avatarUrl}
                alt={participant?.username || "participant"}
                sizeClass="w-8 h-8"
                loading="lazy"
                className={`border-2 border-background absolute shadow-sm ${
                  i === 0 ? "top-0 left-0 z-20" : "bottom-0 right-0 z-10"
                }`}
                fallbackClassName="bg-muted"
              />
            ))}
          </div>
        ) : (
          <div className="relative">
            <UserAvatar
              sizeClass="w-12 h-12"
              className="shadow-sm"
              src={filteredChat.avatar}
              alt={filteredChat.title}
              loading="lazy"
            />
            {isOpponentOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className={`font-semibold text-[14px] truncate ${isActive ? "text-primary" : "text-foreground"}`}>
            {filteredChat.title}
          </p>
          {chat.lastMessage && (
            <span className="text-[11px] text-muted-foreground font-medium ml-2 flex-shrink-0">
              {moment(chat.lastMessage?.createdAt).calendar(null, {
                sameDay: "HH:mm",
                lastDay: "[Yesterday]",
                lastWeek: "ddd",
                sameElse: "DD/MM",
              })}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-[13px] truncate leading-snug ${
              hasIncomingLastMessage && !isActive
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            }`}
          >
            {limitChar(`${messagePrefix}${filteredChat.lastMessage || ""}`, 38) || (
              <span className="italic opacity-60">No messages yet</span>
            )}
          </p>

          {unreadCount > 0 && !isActive && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold leading-5 text-center shrink-0">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Active left indicator bar */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
      )}
    </div>
  );
}
