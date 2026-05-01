import { Aggregate, Mongoose, PipelineStage, Types } from "mongoose";
import Chat, { ChatModel } from "../model/Chat";
import {
  NotFoundError,
  AuthFailureError,
  BadRequestError,
  InternalError,
} from "../../core/ApiError";
// import { getLocalFilePath, getStaticFilePath } from "helpers/utils";
// import { emitSocketEvent } from "socket";
// import { ProtectedRequest } from "types/app-request";
// import { ChatEventEnum } from "../../constants/index";
import Message, { MessageModel } from "../model/Message";

type RecentChatMessage = {
  _id: Types.ObjectId;
  content?: string;
  visibleOnlyTo?: Types.ObjectId | null;
  createdAt: Date;
  sender?: {
    _id?: Types.ObjectId;
    username?: string;
    email?: string;
  } | null;
  attachments?: {
    url: string;
    localPath?: string;
    cloudinaryPublicId?: string;
    resourceType?: "image" | "video" | "raw";
  }[];
};

type MessageSearchResult = {
  messages: any[];
  total: number;
};

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const chatMessageCommonAggregator = (): PipelineStage[] => {
  return [
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "sender",
        as: "sender",
        pipeline: [
          {
            $project: {
              username: 1,
              avatarUrl: 1,
              email: 1,
              isAI: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        sender: { $first: "$sender" },
      },
    },
  ];
};

// find message by Id
const getMessageById = (id: Types.ObjectId): Promise<Message | null> => {
  return MessageModel.findById(id);
};

// get all messages of a particular Id
const getMessagesOfChatId = (
  chatId: Types.ObjectId
): Promise<Array<Message>> => {
  return MessageModel.find({ chat: chatId });
};

const getRecentMessagesByChatId = async (
  chatId: Types.ObjectId,
  limit = 50
): Promise<RecentChatMessage[]> => {
  const recentMessages = await MessageModel.find({ chat: chatId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sender", "username email isAI")
    .select("content contentFormat visibleOnlyTo createdAt sender attachments")
    .lean();

  // Reverse to preserve conversation order from oldest to newest in prompt context.
  return recentMessages.reverse() as RecentChatMessage[];
};

const updateMessageContent = (
  messageId: Types.ObjectId,
  content: string
): Promise<Message | null> => {
  return MessageModel.findByIdAndUpdate(
    messageId,
    {
      $set: {
        content,
        edited: true,
        editedAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { new: true }
  );
};

const toggleReaction = async (
  messageId: Types.ObjectId,
  userId: Types.ObjectId,
  emoji: string
): Promise<Message | null> => {
  const message = await MessageModel.findById(messageId);

  if (!message) {
    return null;
  }

  const normalizedEmoji = emoji.trim();
  const existingReactionIndex = (message.reactions || []).findIndex(
    (reaction) =>
      reaction.user.toString() === userId.toString() &&
      reaction.emoji === normalizedEmoji
  );

  if (existingReactionIndex >= 0) {
    message.reactions?.splice(existingReactionIndex, 1);
  } else {
    message.reactions = message.reactions || [];
    message.reactions.push({
      user: userId,
      emoji: normalizedEmoji,
      createdAt: new Date(),
    });
  }

  message.updatedAt = new Date();
  await message.save();
  return message;
};

const deleteMessageById = (id: Types.ObjectId): Promise<Message | null> => {
  return MessageModel.findByIdAndDelete(id);
};

const deleteAllMessagesOfChatId = (chatId: Types.ObjectId): Promise<any> => {
  return MessageModel.deleteMany({ chat: chatId });
};

// get all messages aggregated
const getAllMessagesAggregated = (chatId: Types.ObjectId): Aggregate<any> => {
  return MessageModel.aggregate([
    {
      $match: {
        chat: chatId,
      },
    },
    {
      $sort: {
        createdAt: 1,
      },
    },
    ...chatMessageCommonAggregator(),
  ]);
};

const getLastMessage = (chatId: Types.ObjectId): Promise<any> => {
  return MessageModel.findOne({ chat: chatId }).sort({ createdAt: -1 }).exec();
};

const searchMessagesInChat = async (
  chatId: Types.ObjectId,
  query: string,
  options?: {
    page?: number;
    limit?: number;
  }
): Promise<MessageSearchResult> => {
  const page = Math.max(1, options?.page || 1);
  const limit = Math.min(100, Math.max(1, options?.limit || 25));
  const skip = (page - 1) * limit;
  const escapedQuery = escapeRegex(query.trim());

  const matchStage = {
    chat: chatId,
    content: {
      $regex: escapedQuery,
      $options: "i",
    },
  };

  const [messages, total] = await Promise.all([
    MessageModel.aggregate([
      {
        $match: matchStage,
      },
      {
        $sort: {
          createdAt: 1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      ...chatMessageCommonAggregator(),
    ]),
    MessageModel.countDocuments(matchStage),
  ]);

  return {
    messages,
    total,
  };
};

// create a new message
const createMessage = (
  userId: Types.ObjectId,
  chatId: Types.ObjectId,
  content: string,
  attachemntFiles: {
    url: string;
    localPath?: string;
    cloudinaryPublicId?: string;
    resourceType?: "image" | "video" | "raw";
  }[],
  contentFormat: "text" | "markdown" = "text",
  visibleOnlyTo: Types.ObjectId | null = null
): Promise<any> => {
  return MessageModel.create({
    sender: userId,
    content: content,
    contentFormat,
    visibleOnlyTo,
    chat: chatId,
    attachments: attachemntFiles,
  });
};

// structure the messages
const getStructuredMessages = (messageId: Types.ObjectId) => {
  return MessageModel.aggregate([
    {
      $match: {
        _id: messageId,
      },
    },
    ...chatMessageCommonAggregator(),
  ]);
};

export default {
  getAllMessagesAggregated,
  createMessage,
  getStructuredMessages,
  getMessageById,
  getMessagesOfChatId,
  getRecentMessagesByChatId,
  deleteMessageById,
  deleteAllMessagesOfChatId,
  getLastMessage,
  searchMessagesInChat,
  updateMessageContent,
  toggleReaction,
};
