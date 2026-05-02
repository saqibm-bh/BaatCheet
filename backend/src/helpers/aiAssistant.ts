import bcrypt from "bcrypt";
import crypto from "crypto";
import { Types } from "mongoose";
import { RoleCode } from "../database/model/Role";
import userRepo from "../database/repositories/userRepo";
import chatRepo from "../database/repositories/chatRepo";
import messageRepo from "../database/repositories/messageRepo";
import User from "../database/model/User";

const AI_USER_USERNAME = "AI Assistant";
const AI_USER_EMAIL = "ai-assistant@baatcheet.local";

const buildRandomPassword = (): string => {
  return crypto.randomBytes(24).toString("hex");
};

export const ensureAiUser = async (): Promise<User> => {
  const existingByFlag = await userRepo.findByUsername(AI_USER_USERNAME);
  if (existingByFlag?.isAI) {
    return existingByFlag;
  }

  const existingByEmail = await userRepo.findByEmail(AI_USER_EMAIL);
  if (existingByEmail) {
    if (!existingByEmail.isAI) {
      await userRepo.updateInfo({
        ...existingByEmail,
        isAI: true,
      } as User);
    }
    return existingByEmail;
  }

  const hashedPassword = await bcrypt.hash(buildRandomPassword(), 10);

  const aiUser = await userRepo.create(
    {
      username: AI_USER_USERNAME,
      email: AI_USER_EMAIL,
      password: hashedPassword,
      isAI: true,
    } as User,
    RoleCode.USER
  );

  return aiUser;
};

export const ensureAiChatForUser = async (
  userId: Types.ObjectId
): Promise<void> => {
  const aiUser = await ensureAiUser();
  const aiUserId = aiUser._id as Types.ObjectId;

  const existingChat = await chatRepo.getExistingOneToOneChat(
    userId,
    aiUserId
  );

  if (existingChat.length) {
    return;
  }

  await chatRepo.createNewOneToOneChat(userId, aiUserId);
};

export const getAiAssistantIdentity = async (): Promise<{
  user: User;
  userId: Types.ObjectId;
  username: string;
}> => {
  const aiUser = await ensureAiUser();
  return {
    user: aiUser,
    userId: aiUser._id as Types.ObjectId,
    username: AI_USER_USERNAME,
  };
};

export const AI_TRIGGER_REGEX = /^\s*(?:@ai(?:\s|$)|\/ai(?:\s|$))/i;

export const isAiTriggerMessage = (content: string): boolean => {
  return AI_TRIGGER_REGEX.test(content || "");
};

export const stripAiTrigger = (content: string): string => {
  return (content || "").replace(AI_TRIGGER_REGEX, "").trim();
};

export const shouldTriggerAiForMessage = (options: {
  aiUserId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
}): boolean => {
  const {
    aiUserId,
    senderId,
    content,
  } = options;

  if (senderId.toString() === aiUserId.toString()) {
    return false;
  }

  return isAiTriggerMessage(content);
};

export type AiContextMessage = {
  role: "user" | "assistant";
  content: string;
};

export const buildAiContextMessages = async (
  chatId: Types.ObjectId,
  limit = 10,
  viewerId?: Types.ObjectId
): Promise<AiContextMessage[]> => {
  const messages = await messageRepo.getRecentMessagesByChatId(chatId, limit);

  const visibleMessages = viewerId
    ? messages.filter((message) => {
        if (!message.visibleOnlyTo) return true;
        return message.visibleOnlyTo.toString() === viewerId.toString();
      })
    : messages;

  return visibleMessages.map((message) => {
    const sender = message.sender || {};
    const senderName = sender.username || sender.email || "Unknown user";
    const content = (message.content || "").trim();
    const hasAttachments =
      Array.isArray(message.attachments) && message.attachments.length > 0;
    const normalizedContent =
      content || (hasAttachments ? "[Attachment message]" : "[Empty message]");

    const normalizedForAi = sender.isAI
      ? normalizedContent
      : `${senderName}: ${stripAiTrigger(normalizedContent) || normalizedContent}`;

    return {
      role: sender.isAI ? "assistant" : "user",
      content: normalizedForAi,
    };
  });
};
