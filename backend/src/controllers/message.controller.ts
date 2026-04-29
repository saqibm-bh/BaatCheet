import { ProtectedRequest } from "../types/app-request";
import {
  AuthFailureError,
  BadRequestError,
  InternalError,
  NotFoundError,
} from "../core/ApiError";
import { SuccessMsgResponse, SuccessResponse } from "../core/ApiResponse";
import { Request, Response } from "express";
import { Types } from "mongoose";
import chatRepo from "../database/repositories/chatRepo";
import messageRepo from "../database/repositories/messageRepo";
import asyncHandler from "../helpers/asyncHandler";
import { removeLocalFile } from "../helpers/utils";
import {
  deleteFromCloudinary,
  uploadBufferToCloudinary,
  validateUploadFileForCloudinary,
} from "../helpers/cloudinary";
import { emitSocketEvent } from "../socket";
import { ChatEventEnum } from "../constants";
import Chat from "../database/model/Chat";
import { cloudinary as cloudinaryConfig } from "../config";

export const getAllMessages = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { chatId } = req.params;
    const currentUser = req.user;

    // retrieve the chat of corresponding chatId
    const selectedChat = await chatRepo.getChatByChatId(
      new Types.ObjectId(chatId)
    );

    // if not chat found throw an error
    if (!selectedChat) {
      throw new NotFoundError("no chat found to retrieve messages");
    }

    // check for existence of current user in this chat
    if (
      !selectedChat.participants?.some(
        (participantId) => participantId.toString() === currentUser?._id.toString()
      )
    ) {
      throw new AuthFailureError("you don't own the chat !");
    }

    // get all the messages in aggreated form
    const messages = await messageRepo.getAllMessagesAggregated(
      new Types.ObjectId(chatId)
    );

    if (!messages) {
      throw new InternalError("error while retrieving messages");
    }

    return new SuccessResponse(
      "messages retrieved successfully",
      messages
    ).send(res);
  }
);

export const searchMessages = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { chatId } = req.params;
    const currentUser = req.user;

    const rawQuery =
      typeof req.query.q === "string" ? req.query.q.trim() : "";
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit || "25"), 10) || 25)
    );

    if (!rawQuery || rawQuery.length < 2) {
      throw new BadRequestError("search query must be at least 2 characters");
    }

    const selectedChat = await chatRepo.getChatByChatId(
      new Types.ObjectId(chatId)
    );

    if (!selectedChat) {
      throw new NotFoundError("no chat found to search messages");
    }

    if (
      !selectedChat.participants?.some(
        (participantId) => participantId.toString() === currentUser?._id.toString()
      )
    ) {
      throw new AuthFailureError("you don't own the chat !");
    }

    const { messages, total } = await messageRepo.searchMessagesInChat(
      new Types.ObjectId(chatId),
      rawQuery,
      {
        page,
        limit,
      }
    );

    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

    return new SuccessResponse("messages search successful", {
      query: rawQuery,
      page,
      limit,
      total,
      totalPages,
      matches: messages,
      messageIds: messages.map((message) => message?._id?.toString()).filter(Boolean),
    }).send(res);
  }
);

// send a message
export const sendMessage = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { content } = req.body;
    const { chatId } = req.params;

    const currentUserId = req.user?._id;
    const files = (req.files as { attachments?: Express.Multer.File[] }) || {
      attachments: [],
    };

    if (!chatId) {
      throw new BadRequestError("no chat  id provided");
    }

    if (!content && !files.attachments?.length) {
      throw new BadRequestError("no content provided");
    }

    const selectedChat = await chatRepo.getChatByChatId(
      new Types.ObjectId(chatId)
    );

    if (!selectedChat) {
      throw new NotFoundError("No  chat found");
    }

    // hold the files sent by user and creating url to access to it
    const attachmentFiles = await Promise.all(
      (files.attachments || []).map(async (attachment) => {
        const resourceType = validateUploadFileForCloudinary(attachment);

        const uploadedAttachment = await uploadBufferToCloudinary({
          fileBuffer: attachment.buffer,
          folder: `${cloudinaryConfig.folder}/messages`,
          resourceType,
          originalFileName: attachment.originalname,
        });

        return {
          url: uploadedAttachment.secureUrl,
          cloudinaryPublicId: uploadedAttachment.publicId,
          resourceType: uploadedAttachment.resourceType,
        };
      })
    );

    // create a new message with attachmentsFiles
    const message = await messageRepo.createMessage(
      new Types.ObjectId(currentUserId),
      new Types.ObjectId(chatId),
      content || "",
      attachmentFiles
    );

    // updating the last message of the chat
    const updatedChat = await chatRepo.updateChatFields(
      new Types.ObjectId(chatId),
      { lastMessage: message._id, updatedAt: new Date() }
    );

    // structure the message
    const structuredMessage = await messageRepo.getStructuredMessages(
      message._id
    );

    if (!structuredMessage.length) {
      throw new InternalError("error creating message: " + message._id);
    }

    // emit socket event to all user to receive current messsage
    updatedChat.participants.forEach((participantId: Types.ObjectId) => {
      if (participantId.toString() === currentUserId.toString()) return;

      emitSocketEvent(
        req,
        participantId.toString(),
        ChatEventEnum.MESSAGE_RECEIVED_EVENT,
        structuredMessage[0]
      );
    });

    return new SuccessResponse(
      "message sent successfully",
      structuredMessage[0]
    ).send(res);
  }
);

// delete message
export const deleteMessage = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { messageId } = req.params;
    const currentUserId = req.user?._id;

    if (!messageId) {
      throw new BadRequestError("no message id provided");
    }

    const existingMessage = await messageRepo.getMessageById(
      new Types.ObjectId(messageId)
    );

    if (!existingMessage)
      throw new BadRequestError("invalid message id, message not found");

    // fetch the existing chat
    const existingChat = await chatRepo.getChatByChatId(existingMessage?.chat);

    if (!existingChat)
      throw new InternalError("Internal Error: chat not found");

    // if the existing chat participants includes the current userId
    if (
      !existingChat?.participants?.some(
        (participantId) => participantId.toString() === currentUserId.toString()
      )
    ) {
      throw new AuthFailureError("you don't own the message");
    }

    // check if for currentUserId presence in the message sender
    if (!(existingMessage.sender.toString() === currentUserId.toString()))
      throw new AuthFailureError("you don't own the message ");

    // delete the attachments of the message from the local folder
    if (
      existingMessage &&
      existingMessage.attachments &&
      existingMessage.attachments.length > 0
    ) {
      await Promise.all(
        existingMessage.attachments.map(async (attachment) => {
          if (attachment.cloudinaryPublicId) {
            await deleteFromCloudinary(
              attachment.cloudinaryPublicId,
              attachment.resourceType || "image"
            );
            return;
          }

          if (attachment.localPath) {
            removeLocalFile(attachment.localPath);
          }
        })
      );
    }

    // delete the message from database
    const deletedMsg = await messageRepo.deleteMessageById(existingMessage._id);

    if (!deletedMsg)
      throw new InternalError("Internal Error: Couldn't delete message");

    // update the last message of the chat
    let lastMessage: any;
    if (
      existingChat?.lastMessage?.toString() === existingMessage._id.toString()
    ) {
      lastMessage = await messageRepo.getLastMessage(existingChat._id);

      await chatRepo.updateChatFields(existingChat._id, {
        $set: {
          lastMessage: lastMessage?._id,
        },
      });
    }

    // emit delete message event to all users
    existingChat.participants.forEach((participantId: Types.ObjectId) => {
      if (participantId.toString() === currentUserId.toString()) return;

      emitSocketEvent(
        req,
        participantId.toString(),
        ChatEventEnum.MESSAGE_DELETE_EVENT,
        {
          messageId: existingMessage._id,
          // chatLastMessage: lastMessage.content || "attachment",
        }
      );
    });

    return new SuccessMsgResponse("message deleted successfully").send(res);
  }
);

export const editMessage = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { messageId } = req.params;
    const currentUserId = req.user?._id;
    const { content } = req.body;

    if (!messageId) {
      throw new BadRequestError("no message id provided");
    }

    const trimmedContent = typeof content === "string" ? content.trim() : "";
    if (!trimmedContent) {
      throw new BadRequestError("message content is required");
    }

    const existingMessage = await messageRepo.getMessageById(
      new Types.ObjectId(messageId)
    );

    if (!existingMessage) {
      throw new NotFoundError("message not found");
    }

    if (existingMessage.sender.toString() !== currentUserId.toString()) {
      throw new AuthFailureError("you don't own the message");
    }

    const existingChat = await chatRepo.getChatByChatId(existingMessage.chat);
    if (!existingChat) {
      throw new NotFoundError("chat not found");
    }

    const updatedMessage = await messageRepo.updateMessageContent(
      existingMessage._id,
      trimmedContent
    );

    if (!updatedMessage) {
      throw new InternalError("error while editing message");
    }

    const structuredMessage = await messageRepo.getStructuredMessages(
      updatedMessage._id
    );

    if (!structuredMessage.length) {
      throw new InternalError("unable to structure updated message");
    }

    existingChat.participants.forEach((participantId: Types.ObjectId) => {
      emitSocketEvent(
        req,
        participantId.toString(),
        ChatEventEnum.MESSAGE_UPDATE_EVENT,
        structuredMessage[0]
      );
    });

    return new SuccessResponse(
      "message edited successfully",
      structuredMessage[0]
    ).send(res);
  }
);

export const toggleMessageReaction = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { messageId } = req.params;
    const currentUserId = req.user?._id;
    const { emoji } = req.body;

    if (!messageId) {
      throw new BadRequestError("no message id provided");
    }

    const normalizedEmoji = typeof emoji === "string" ? emoji.trim() : "";
    if (!normalizedEmoji) {
      throw new BadRequestError("emoji is required");
    }

    const existingMessage = await messageRepo.getMessageById(
      new Types.ObjectId(messageId)
    );

    if (!existingMessage) {
      throw new NotFoundError("message not found");
    }

    const existingChat = await chatRepo.getChatByChatId(existingMessage.chat);
    if (!existingChat) {
      throw new NotFoundError("chat not found");
    }

    if (
      !existingChat.participants?.some(
        (participantId) => participantId.toString() === currentUserId.toString()
      )
    ) {
      throw new AuthFailureError("you don't own this chat");
    }

    const updatedMessage = await messageRepo.toggleReaction(
      existingMessage._id,
      new Types.ObjectId(currentUserId),
      normalizedEmoji
    );

    if (!updatedMessage) {
      throw new InternalError("error while toggling reaction");
    }

    const structuredMessage = await messageRepo.getStructuredMessages(
      updatedMessage._id
    );

    if (!structuredMessage.length) {
      throw new InternalError("unable to structure reacted message");
    }

    existingChat.participants.forEach((participantId: Types.ObjectId) => {
      emitSocketEvent(
        req,
        participantId.toString(),
        ChatEventEnum.MESSAGE_REACTION_EVENT,
        structuredMessage[0]
      );
    });

    return new SuccessResponse(
      "message reaction updated successfully",
      structuredMessage[0]
    ).send(res);
  }
);
