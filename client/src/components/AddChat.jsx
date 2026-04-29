import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
  DialogTitle,
  Switch,
} from "@headlessui/react";
import { Fragment, useRef, useState } from "react";
import { BiSearch, RiUserSearchLine, RxCross2, profile2 } from "../assets";
import {
  createOneToOneChat,
  getAllcurrentUserChats,
  getAvailableUsers,
  createGroupChat,
} from "../api";
import { useChat } from "../context/ChatContext";
import { requestHandler } from "../utils";
import UserAvatar from "./UserAvatar";

export function AddChat({ open }) {
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupChatParticipants, setGroupChatParticipants] = useState([]);
  const [users, setUsers] = useState([]);
  const [creatingChat, setCreatingChat] = useState(false);

  // context
  const {
    openAddChat,
    setOpenAddChat,
    newChatUser,
    setNewChatUser,
    loadingChats,
    setLoadingChats,
    currentUserChats,
    setCurrentUserChats,
    getCurrentUserChats,
    setActiveLeftSidebar,
  } = useChat();

  // ref's
  const searchUserRef = useRef();

  const handleClose = () => {
    setUsers([]);
    setNewChatUser(null);
    setGroupName("");
    setGroupChatParticipants([]);
    setOpenAddChat(false);
  };

  // search users for the adding into group
  const handleSearchUser = async () => {
    const { data } = await getAvailableUsers(searchUserRef.current.value);
    setUsers(data.data?.users || []);
  };

  // create a new chat with a new user
  const createNewOneToOneChat = async () => {
    if (!newChatUser) return alert("please select an user"); // if user not selected to create chat with

    // handle the request to create a new chat
    await requestHandler(
      () => createOneToOneChat(newChatUser?._id), // pass the userId to chat with
      setCreatingChat,
      (res) => {
        const { data } = res;
        // alert a message if chat already exists by seeing the flag field "existing"
        if (data?.existing) {
          return alert("chat already exists with the selected user");
        }

        // if chat is created fetch all the updated current user chats
        getCurrentUserChats();
        setActiveLeftSidebar("recentChats");
        handleClose();
      },
      alert
    );
  };

  // create group chat
  const createNewGroupChat = async () => {
    // check if group name exists or not
    if (!groupName.trim()) {
      return alert("no group name provided");
    }

    // check for group chat participants
    if (!groupChatParticipants.length || groupChatParticipants.length < 2) {
      return alert("There must be atleast 2 members in the group");
    }

    await requestHandler(
      async () => createGroupChat(groupName, groupChatParticipants),
      setCreatingChat,
      (res) => {
        const { data } = res;
        getCurrentUserChats();
        setActiveLeftSidebar("recentChats");
        handleClose();
      }
    );
  };
  return (
    <Transition show={openAddChat} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
        <Transition
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 bg-opacity-75 transition-opacity" />
        </Transition>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="w-full relative transform overflow-hidden rounded-3xl bg-background/95 backdrop-blur-xl border border-border/50 px-6 pb-6 pt-8 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-8">
                <div className="sm:flex sm:items-start">
                  <div className="w-full mt-3 text-center sm:mt-0 sm:text-left">
                    <DialogTitle as="h3" className="text-2xl font-bold text-foreground tracking-tight">
                      Create chat
                    </DialogTitle>
                    <div className="mt-4 flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/50">
                      <Switch
                        checked={isGroupChat}
                        onChange={setIsGroupChat}
                        className="group inline-flex h-6 w-11 items-center rounded-full bg-gray-400 transition data-[checked]:bg-primary"
                      >
                        <span className="size-4 translate-x-1 rounded-full bg-white transition group-data-[checked]:translate-x-6" />
                      </Switch>
                      <span className="text-sm font-semibold text-foreground">
                        Enable Group Chat Flow
                      </span>
                    </div>

                    {!isGroupChat && (
                      <div className="mt-3">
                        <p className="text-lg font-medium dark:text-slate-50 text-slate-900">
                          Sure you want to create a chat with{" "}
                          {newChatUser?.username} ?
                        </p>
                      </div>
                    )}

                    {isGroupChat && (
                      <div className="w-full">
                        <div className="inputs mt-5">
                          <input
                            type="text"
                            className="w-full px-4 py-3 rounded-xl outline-none bg-muted/50 border border-input focus:ring-2 focus:ring-primary/40 text-foreground transition-all placeholder:text-muted-foreground shadow-sm"
                            placeholder="Enter a group name"
                            onChange={(e) => setGroupName(e.target.value)}
                          />

                          <div className="addParticpants mt-2">
                            <div className="w-full flex justify-between items-center rounded-xl border border-input bg-muted/40 px-2 focus-within:ring-2 focus-within:ring-primary/40 transition-all mt-4 shadow-sm">
                              <input
                                type="text"
                                className="w-[90%] px-2 py-3 rounded-xl outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
                                placeholder="Add more users..."
                                ref={searchUserRef}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleSearchUser();
                                  }
                                }}
                              />
                              <button
                                type="button"
                                className="hci-tooltip text-slate-400 px-3"
                                onClick={() => handleSearchUser()}
                                aria-label="Search users"
                                data-tooltip="Search"
                              >
                                <BiSearch className="size-5" />
                              </button>
                            </div>
                            <div className="inputAccordianDiv">
                              <ul className="dark:bg-backgroundDark3 rounded-md px-2 mt-1 max-h-[150px] overflow-auto ">
                                {users.map((user) => (
                                  <li
                                    key={user._id}
                                    className="dark:text-slate-100 flex justify-between items-center m-2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <UserAvatar
                                        sizeClass="w-10 h-10"
                                        src={user.avatarUrl}
                                        alt={user.username}
                                      />
                                      <span>{user.username}</span>
                                    </div>
                                    {!groupChatParticipants.some(
                                      ({ _id }) => user._id === _id
                                    ) ? (
                                      <button
                                        className="px-2 py-1 text-xs dark:text-white text-black bg-primary rounded-md hover:bg-primary_hover"
                                        onClick={() => {
                                          if (
                                            isGroupChat &&
                                            !groupChatParticipants?.some(
                                              (participant) =>
                                                participant._id === user._id
                                            )
                                          ) {
                                            setGroupChatParticipants([
                                              ...groupChatParticipants,
                                              user,
                                            ]);
                                          }
                                        }}
                                      >
                                        Add
                                      </button>
                                    ) : (
                                      ""
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="addedParticipants flex flex-wrap justify-center gap-1  mt-2">
                              {!!groupChatParticipants.length &&
                                groupChatParticipants.map((user) => (
                                  <div
                                    key={user._id}
                                    className="flex gap-[2px]  dark:bg-backgroundDark2 p-2 rounded-full items-center"
                                  >
                                    <div className="flex items-center gap-1">
                                      <UserAvatar
                                        sizeClass="size-5"
                                        src={user.avatarUrl || profile2}
                                        alt={user.username}
                                      />
                                      <span className="text-xs dark:text-slate-300">
                                        {user.username}
                                      </span>
                                    </div>
                                      <button
                                        className="hci-tooltip ml-2 text-white hover:text-red-300 transition-colors bg-white/20 p-1 rounded-full"
                                        aria-label={`Remove ${user.username}`}
                                        data-tooltip="Remove"
                                        onClick={() => {
                                          setGroupChatParticipants(
                                            groupChatParticipants.filter(
                                              ({ _id }) => user._id !== _id
                                            )
                                          );
                                        }}
                                      >
                                        <RxCross2 className="text-xs" />
                                      </button>
                                    </div>
                                  ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-border/50">
                  <button
                    type="button"
                    className="rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted shadow-sm transition-all"
                    onClick={handleClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-transparent bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-lg active:scale-95 transition-all"
                    onClick={
                      isGroupChat ? createNewGroupChat : createNewOneToOneChat
                    }
                  >
                    {isGroupChat ? "Create Group" : "Create Chat"}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
