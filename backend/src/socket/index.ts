import cookie from "cookie";
import User from "../database/model/User";
import { Namespace, Socket } from "socket.io";
import { ChatEventEnum } from "../constants";
import { Server } from "http";
import { Application, Request } from "express";
import { BadTokenError } from "../core/ApiError";
import JWT from "../core/JWT";
import userRepo from "../database/repositories/userRepo";
import colorsUtils from "../helpers/colorsUtils";
import { Types } from "mongoose";

declare module "socket.io" {
  interface Socket {
    user?: User;
  }
}

interface WebRtcOfferPayload {
  newOffer: any;
  sendToUserId: string;
}

interface WebRtcAnswerPayload {
  offererUserId?: string;
  answer?: any;
}

interface IceCandidatePayload {
  iceCandidate: any;
  didIOffer: boolean | { current?: boolean };
}

interface TypingPayload {
  chatId: string;
  userId?: string;
  userName?: string;
  isAi?: boolean;
}

interface ActiveCallOffer {
  offererUserId: string;
  answererUserId: string;
  offer: any;
  answer?: any;
  offerIceCandidates: any[];
  answerIceCandidates: any[];
}

const activeCallOffers: ActiveCallOffer[] = [];
const onlineUserCounts = new Map<string, number>();

const emitActiveUsers = (io: any, socket: Socket): void => {
  socket.emit(ChatEventEnum.ACTIVE_USERS_EVENT, Array.from(onlineUserCounts.keys()));
};

const markUserOnline = (io: any, userId: string): void => {
  const currentCount = onlineUserCounts.get(userId) || 0;
  onlineUserCounts.set(userId, currentCount + 1);

  if (currentCount === 0) {
    io.emit(ChatEventEnum.USER_ONLINE_EVENT, userId);
  }
};

const markUserOffline = (io: any, userId: string): void => {
  const currentCount = onlineUserCounts.get(userId) || 0;
  const nextCount = Math.max(0, currentCount - 1);

  if (nextCount === 0) {
    onlineUserCounts.delete(userId);
    io.emit(ChatEventEnum.USER_OFFLINE_EVENT, userId);
    return;
  }

  onlineUserCounts.set(userId, nextCount);
};

const getMostRecentOffer = (
  predicate: (offer: ActiveCallOffer) => boolean
): ActiveCallOffer | undefined => {
  for (let index = activeCallOffers.length - 1; index >= 0; index -= 1) {
    const currentOffer = activeCallOffers[index];
    if (predicate(currentOffer)) {
      return currentOffer;
    }
  }

  return undefined;
};

const removeOffersByUserPair = (firstUserId: string, secondUserId: string): void => {
  for (let index = activeCallOffers.length - 1; index >= 0; index -= 1) {
    const offer = activeCallOffers[index];
    const matchesPair =
      (offer.offererUserId === firstUserId &&
        offer.answererUserId === secondUserId) ||
      (offer.offererUserId === secondUserId &&
        offer.answererUserId === firstUserId);

    if (matchesPair) {
      activeCallOffers.splice(index, 1);
    }
  }
};

const removeOffersByUserId = (userId: string): void => {
  for (let index = activeCallOffers.length - 1; index >= 0; index -= 1) {
    const offer = activeCallOffers[index];
    if (offer.offererUserId === userId || offer.answererUserId === userId) {
      activeCallOffers.splice(index, 1);
    }
  }
};

// handles the join chat event ie; when a user join a room
const mountJoinChatEvent = (socket: Socket): void => {
  socket.on(ChatEventEnum.JOIN_CHAT_EVENT, (chatId: string) => {
    colorsUtils.log("info", "user joined a chat room. chatId: " + chatId);
    socket.join(chatId); // join the user to a chat between or group chat
  });
};

// handle the start Typing event
const mountStartTypingEvent = (socket: Socket): void => {
  socket.on(ChatEventEnum.START_TYPING_EVENT, (payload: string | TypingPayload) => {
    const chatId = typeof payload === "string" ? payload : payload?.chatId;
    if (!chatId?.trim()) return;

    const typingPayload: TypingPayload = {
      chatId: chatId.trim(),
      userId: socket.user?._id?.toString(),
      userName: socket.user?.username || socket.user?.email || "Unknown user",
      isAi: false,
    };

    socket.to(chatId).emit(ChatEventEnum.START_TYPING_EVENT, typingPayload);
  });
};

// handle the stop Typing event
const mountStopTypingEvent = (socket: Socket): void => {
  socket.on(ChatEventEnum.STOP_TYPING_EVENT, (payload: string | TypingPayload) => {
    const chatId = typeof payload === "string" ? payload : payload?.chatId;
    if (!chatId?.trim()) return;

    const stopPayload: TypingPayload = {
      chatId: chatId.trim(),
      userId: socket.user?._id?.toString(),
      userName: socket.user?.username || socket.user?.email || "Unknown user",
      isAi: false,
    };

    socket.to(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, stopPayload);
  });
};

// WebRTC signaling events used by the client for call setup/teardown.
const mountWebRtcSignalingEvents = (socket: Socket): void => {
  socket.on("newOffer", (payload: WebRtcOfferPayload) => {
    if (!socket.user?._id || !payload?.newOffer || !payload?.sendToUserId) {
      return;
    }

    const offererUserId = socket.user._id.toString();
    const answererUserId = payload.sendToUserId.trim();

    if (!answererUserId || answererUserId === offererUserId) {
      return;
    }

    removeOffersByUserPair(offererUserId, answererUserId);

    activeCallOffers.push({
      offererUserId,
      answererUserId,
      offer: payload.newOffer,
      offerIceCandidates: [],
      answerIceCandidates: [],
    });

    socket.to(answererUserId).emit("newOfferAwaiting", {
      offer: payload.newOffer,
      offererUserId,
    });
  });

  socket.on(
    "newAnswer",
    (
      payload: WebRtcAnswerPayload,
      ack?: (offerIceCandidates: any[]) => void
    ) => {
      if (!socket.user?._id || !payload?.offererUserId || !payload?.answer) {
        ack?.([]);
        return;
      }

      const answererUserId = socket.user._id.toString();
      const offer = getMostRecentOffer(
        (activeOffer) =>
          activeOffer.offererUserId === payload.offererUserId &&
          activeOffer.answererUserId === answererUserId
      );

      if (!offer) {
        ack?.([]);
        return;
      }

      offer.answer = payload.answer;

      socket.to(offer.offererUserId).emit("answerResponse", {
        answer: payload.answer,
      });

      ack?.(offer.offerIceCandidates);
    }
  );

  socket.on("sendIceCandidateToSignalingServer", (payload: IceCandidatePayload) => {
    if (!socket.user?._id || !payload?.iceCandidate) {
      return;
    }

    const currentUserId = socket.user._id.toString();
    const didIOffer =
      typeof payload.didIOffer === "boolean"
        ? payload.didIOffer
        : Boolean(payload.didIOffer?.current);

    if (didIOffer) {
      const offer = getMostRecentOffer(
        (activeOffer) => activeOffer.offererUserId === currentUserId
      );

      if (!offer) {
        return;
      }

      offer.offerIceCandidates.push(payload.iceCandidate);
      socket.to(offer.answererUserId).emit(
        "receivedIceCandidateFromServer",
        payload.iceCandidate
      );
      return;
    }

    const offer = getMostRecentOffer(
      (activeOffer) => activeOffer.answererUserId === currentUserId
    );

    if (!offer) {
      return;
    }

    offer.answerIceCandidates.push(payload.iceCandidate);
    socket
      .to(offer.offererUserId)
      .emit("receivedIceCandidateFromServer", payload.iceCandidate);
  });

  socket.on("hangupCall", (targetUserId: string) => {
    if (!socket.user?._id || !targetUserId?.trim()) {
      return;
    }

    const currentUserId = socket.user._id.toString();
    const normalizedTargetUserId = targetUserId.trim();

    socket.to(normalizedTargetUserId).emit("hangupCallReq", {
      fromUserId: currentUserId,
    });

    removeOffersByUserPair(currentUserId, normalizedTargetUserId);
  });
};

// function to initialize the socket io
const initSocketIo = (io: any): void => {
  io.on("connection", async (socket: Socket) => {
    try {
      // get the token from the cookies or the handshake auth header
      const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
      let token = cookies?.accessToken || socket.handshake.auth?.token;

      // throw an error if the token is not found
      if (!token) {
        throw new BadTokenError("Token not found");
      }

      // decode the token
      const decodedToken = await JWT.validateToken(token);

      // get user info
      const userId = new Types.ObjectId(decodedToken.sub);
      const user = await userRepo.findById(userId);

      if (!user) {
        throw new BadTokenError("Invalid token");
      }

      socket.user = user;
      socket.join(user._id.toString());
      socket.emit(ChatEventEnum.CONNECTED_EVENT);
      markUserOnline(io, user._id.toString());
      emitActiveUsers(io, socket);
      colorsUtils.log(
        "info",
        "🤝 User connected. userId: " + user._id.toString()
      );

      mountJoinChatEvent(socket);
      mountStartTypingEvent(socket);
      mountStopTypingEvent(socket);
      mountWebRtcSignalingEvents(socket);

      // disconnect event
      socket.on(ChatEventEnum.DISCONNECTED_EVENT, () => {
        if (socket.user?._id) {
          socket.leave(socket.user._id.toString());
          removeOffersByUserId(socket.user._id.toString());
          markUserOffline(io, socket.user._id.toString());
        }
      });

      socket.on("disconnect", () => {
        if (socket.user?._id) {
          removeOffersByUserId(socket.user._id.toString());
          markUserOffline(io, socket.user._id.toString());
        }
      });
    } catch (error) {
      socket.emit(
        ChatEventEnum.SOCKET_ERROR_EVENT,
        "something went wrong while connecting to socket"
      );
    }
  });
};

const emitSocketEvent = (
  req: Request,
  roomId: string,
  event: ChatEventEnum,
  payload: any
): void => {
  const io = req.app.get("io") as Namespace;
  io.in(roomId).emit(event, payload);
};

export { initSocketIo, emitSocketEvent };
