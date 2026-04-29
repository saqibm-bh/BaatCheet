import React, { useRef } from "react";
import { BiSearch } from "../assets";
import { getAvailableUsers } from "../api";
import { useChat } from "../context/ChatContext";
import UserAvatar from "./UserAvatar";

const SearchedUsersResultCard = ({ user }) => {
  const { setOpenAddChat, setNewChatUser } = useChat();

  const handleCreateChatClick = () => {
    setNewChatUser(user);
    setOpenAddChat(true);
  };

  return (
    <div className="flex justify-between p-4 my-1 rounded-md bg-backgroundLight3 dark:bg-backgroundDark1 items-center w-full">
      <div className="flex gap-2 items-center w-max">
        <div>
          <UserAvatar
            sizeClass="size-8"
            src={user.avatarUrl}
            alt={user.username}
            loading="lazy"
          />
        </div>

        <div>
          <h3 className="font-medium text-base text-slate-700 dark:text-slate-100">
            {user.username}
          </h3>
        </div>
      </div>
      <button
        onClick={handleCreateChatClick}
        className="hci-tooltip bg-primary hover:bg-primary_hover text-sm rounded-lg px-2 py-1 cursor-pointer"
        aria-label={`Create chat with ${user.username}`}
        data-tooltip="Create chat"
      >
        + create chat
      </button>
    </div>
  );
};

export default function SearchUserSidebar() {
  const searchInputRef = useRef();

  // useChat hook
  const { searchedUsers, setSearchedUsers } = useChat();

  const searchUsers = async () => {
    const { data } = await getAvailableUsers(searchInputRef.current.value);
    setSearchedUsers(data.data?.users || []);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      searchUsers();
    }
    if (!searchInputRef.current.value.trim()) {
      setSearchedUsers(null);
    }
  };
  return (
    <div className="px-5 py-6 w-full h-full">
      <div className="top">
        <h1 className="text-black font-medium text-xl dark:text-white">
          Search Users
        </h1>
        <div
          className="flex
        items-center gap-1 bg-backgroundLight3 dark:bg-backgroundDark1 dark:text-slate-300 p-3 rounded-md my-5"
        >
          <div className="text-xl">
            <BiSearch />
          </div>
          <input
            type="text"
            className="bg-transparent outline-none px-2 w-[90%]"
            placeholder="Enter a Email or Username"
            ref={searchInputRef}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            onClick={searchUsers}
            className="hci-tooltip text-xs font-semibold text-primary bg-primary/10 rounded-md px-2 py-1"
            aria-label="Search users"
            data-tooltip="Search"
          >
            Go
          </button>
        </div>

        <div>
          <h1 className="text-black font-medium text-xl dark:text-white">
            {searchedUsers?.length ? "Search Results" : ""}
          </h1>
          <div className="recentUserChats h-[calc(100dvh-170px)] md:h-[calc(100dvh-280px)] overflow-auto ">
            {!searchedUsers ? (
              <h2 className="text-center text-lg dark:text-slate-300 text-slate-500">
                create a chat with friends by searching them !
              </h2>
            ) : !searchedUsers.length ? (
              <h2 className="text-center text-xl text-slate-400">
                No users found{" "}
              </h2>
            ) : (
              searchedUsers?.map((user) => (
                <SearchedUsersResultCard key={user._id} user={user} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
