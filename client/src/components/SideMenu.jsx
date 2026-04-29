import React from "react";
import { LuUser, PiChats, RiUserSearchLine } from "../assets";
import ThemeSwitchButton from "../components/ThemeSwitchButton";
import { useAuth } from "../context/AuthContext";
import LogoMark from "./LogoMark";
import { FiPlus } from "react-icons/fi";
import UserAvatar from "./UserAvatar";

export default function SideMenu({
  activeLeftSidebar,
  setActiveLeftSidebar,
  mode = "desktop",
  onCreateChat,
}) {
  const sideMenuOptions = [
    { Icon: LuUser, name: "profile", label: "Profile" },
    { Icon: PiChats, name: "recentChats", label: "Chats" },
    { Icon: RiUserSearchLine, name: "searchUser", label: "Discover" },
  ];

  const { user } = useAuth();
  const isMobile = mode === "mobile";

  return (
    <div
      className={`side-menu z-20 ${
        isMobile
          ? "w-full px-3 py-2 rounded-2xl border border-border/50 bg-background/90 backdrop-blur-xl shadow-xl"
          : "h-full w-[90px] py-5 border-r border-border/50 glass-panel bg-background/55 shadow-sm"
      }`}
    >
      <div
        className={`w-full flex ${
          isMobile
            ? "items-center justify-between"
            : "h-full flex-col items-center justify-between"
        }`}
      >
        <div className={`flex items-center ${isMobile ? "gap-2" : "mb-3"}`}>
          <div className="w-10 h-10 md:w-9 md:h-9 flex items-center justify-center bg-primary/10 rounded-xl">
            <LogoMark className="w-7 h-7 text-primary" />
          </div>

          {isMobile && (
            <div className="leading-tight">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                BaatCheet
              </p>
              <p className="text-[12px] font-semibold text-foreground">Conversations</p>
            </div>
          )}
        </div>

        <div className={`flex-1 ${isMobile ? "mx-2" : "w-full flex justify-center"}`}>
          <ul
            className={`flex ${
              isMobile ? "items-center justify-evenly" : "flex-col items-center gap-2"
            }`}
          >
            {sideMenuOptions.map(({ Icon, name, label }, index) => {
              const isActive = name === activeLeftSidebar;

              return (
                <li key={index}>
                  <button
                    aria-label={label}
                    data-tooltip={label}
                    data-tooltip-pos={isMobile ? "top" : "right"}
                    className={`relative ${
                      isMobile
                        ? "w-[74px] h-[54px] rounded-xl"
                        : "w-[54px] h-[54px] rounded-2xl"
                    } hci-tooltip flex flex-col items-center justify-center transition-all duration-200 ease-in-out ${
                      isActive
                        ? "text-primary bg-primary/12 shadow-md shadow-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                    onClick={() => setActiveLeftSidebar(name)}
                  >
                    <Icon className={`${isMobile ? "text-[19px]" : "text-[22px]"}`} />
                    {isMobile && (
                      <span className="text-[10px] mt-0.5 font-semibold tracking-wide">
                        {label}
                      </span>
                    )}

                    {isActive && (
                      <span
                        className={`absolute ${
                          isMobile
                            ? "bottom-1.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5"
                            : "right-1 top-1 h-2 w-2"
                        } rounded-full bg-primary`}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div
          className={`flex ${
            isMobile ? "items-center gap-2" : "flex-col items-center gap-3"
          }`}
        >
          <button
            type="button"
            onClick={() => onCreateChat?.()}
            data-tooltip="New chat"
            data-tooltip-pos={isMobile ? "top" : "right"}
            className={`flex items-center justify-center ${
              isMobile ? "h-10 w-10" : "h-11 w-11"
            } hci-tooltip rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95`}
            aria-label="New chat"
          >
            <FiPlus className="text-[18px]" />
          </button>

          <div
            className="hci-tooltip w-10 h-10 flex items-center justify-center rounded-full bg-muted/30 hover:bg-muted border border-border/50 text-foreground transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
            data-tooltip="Toggle theme"
            data-tooltip-pos={isMobile ? "top" : "right"}
          >
            <ThemeSwitchButton />
          </div>

          <button
            type="button"
            onClick={() => setActiveLeftSidebar("profile")}
            aria-label="Open profile"
            data-tooltip="Profile"
            data-tooltip-pos={isMobile ? "top" : "right"}
            className="hci-tooltip rounded-full hover:scale-105 transition-transform"
          >
            <UserAvatar
              src={user?.avatarUrl}
              alt={user?.username || "User"}
              sizeClass="w-10 h-10"
              className="border-2 border-primary/20 shadow-sm"
              fallbackClassName="bg-primary/15 text-primary border-primary/30"
              iconClassName={user?.avatarUrl ? "text-[50%]" : "text-[50%]"}
              loading="lazy"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
