import { Types } from "mongoose";
import { openrouter } from "../config";
import { emitSocketEvent } from "../socket";
import { ChatEventEnum } from "../constants";
import messageRepo from "../database/repositories/messageRepo";
import chatRepo from "../database/repositories/chatRepo";
import { Request } from "express";
import { AiContextMessage } from "./aiAssistant";

type OpenRouterStreamOptions = {
  req: Request;
  chatId: Types.ObjectId;
  aiUserId: Types.ObjectId;
  participantIds: Types.ObjectId[];
  contextMessages: AiContextMessage[];
  userMessage: string;
  imageUrls: string[];
  isPrivateQuery?: boolean;
  senderId?: Types.ObjectId;
};

const buildPayload = (
  contextMessages: AiContextMessage[],
  userMessage: string,
  imageUrls: string[]
) => {
  const normalizedUserMessage = (userMessage || "").trim();
  const textPart = normalizedUserMessage || "Please respond to the latest message.";

  const userContent = imageUrls.length
    ? [
        { type: "text", text: textPart },
        ...imageUrls.map((url) => ({
          type: "image_url",
          image_url: { url },
        })),
      ]
    : textPart;

  return {
    model: openrouter.model,
    stream: true,
    messages: [
      {
        role: "system",
        content:
          "You are BaatCheet AI Assistant. Be concise, helpful, and friendly.",
      },
      ...contextMessages,
      {
        role: "user",
        content: userContent,
      },
    ],
  };
};

const emitToStreamTarget = (
  options: OpenRouterStreamOptions,
  event: ChatEventEnum,
  payload: any
): void => {
  const targetRoom =
    options.isPrivateQuery && options.senderId
      ? options.senderId.toString()
      : options.chatId.toString();

  emitSocketEvent(options.req, targetRoom, event, payload);
};

export const streamOpenRouterResponse = async (
  options: OpenRouterStreamOptions
): Promise<void> => {
  const streamMetadata = {
    chatId: options.chatId.toString(),
    senderId: options.aiUserId.toString(),
    isPrivateQuery: Boolean(options.isPrivateQuery),
  };

  emitToStreamTarget(
    options,
    ChatEventEnum.MESSAGE_STREAM_START_EVENT,
    streamMetadata
  );

  try {
    if (!openrouter.apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const payload = buildPayload(
      options.contextMessages,
      options.userMessage,
      options.imageUrls
    );

    const response = await fetch(openrouter.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouter.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      throw new Error(`OpenRouter request failed: ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const data = trimmed.replace(/^data:\s*/, "");
        if (data === "[DONE]") {
          break;
        }

        try {
          const json = JSON.parse(data);
          const delta = json?.choices?.[0]?.delta?.content || "";
          if (!delta) continue;

          fullText += delta;

          emitToStreamTarget(options, ChatEventEnum.MESSAGE_CHUNK_EVENT, {
            ...streamMetadata,
            chunk: delta,
          });
        } catch (error) {
          // Ignore malformed chunks and keep streaming.
        }
      }
    }

    const normalizedText = fullText.trim();
    if (!normalizedText) {
      throw new Error("OpenRouter returned an empty response");
    }

    const aiMessage = await messageRepo.createMessage(
      options.aiUserId,
      options.chatId,
      normalizedText,
      [],
      "markdown",
      options.isPrivateQuery && options.senderId ? options.senderId : null
    );

    if (!options.isPrivateQuery) {
      await chatRepo.updateChatFields(options.chatId, {
        lastMessage: aiMessage._id,
        updatedAt: new Date(),
      });
    }

    const structuredMessage = await messageRepo.getStructuredMessages(
      aiMessage._id
    );

    if (!structuredMessage.length) {
      throw new Error("Unable to structure AI message");
    }

    emitToStreamTarget(options, ChatEventEnum.MESSAGE_COMPLETE_EVENT, {
      ...streamMetadata,
      message: structuredMessage[0],
    });

    if (options.isPrivateQuery && options.senderId) {
      emitSocketEvent(
        options.req,
        options.senderId.toString(),
        ChatEventEnum.MESSAGE_RECEIVED_EVENT,
        structuredMessage[0]
      );
    } else {
      options.participantIds.forEach((participantId: Types.ObjectId) => {
        emitSocketEvent(
          options.req,
          participantId.toString(),
          ChatEventEnum.MESSAGE_RECEIVED_EVENT,
          structuredMessage[0]
        );
      });
    }
  } catch (error) {
    emitToStreamTarget(options, ChatEventEnum.MESSAGE_STREAM_ERROR_EVENT, {
      ...streamMetadata,
      message: "AI is currently unavailable. Please try again shortly.",
    });
  }
};
