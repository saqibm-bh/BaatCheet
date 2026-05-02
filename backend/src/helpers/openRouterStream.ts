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

const emitAiTyping = (
  options: OpenRouterStreamOptions,
  event: ChatEventEnum
) => {
  const typingPayload = {
    chatId: options.chatId.toString(),
    userId: options.aiUserId.toString(),
    userName: "AI Assistant",
    isAi: true,
  };

  emitToStreamTarget(options, event, typingPayload);
};

const normalizeSocketMessage = (message: any, chatId: Types.ObjectId) => {
  if (!message) return message;
  return {
    ...message,
    chat: chatId.toString(),
  };
};

export const streamOpenRouterResponse = async (
  options: OpenRouterStreamOptions
): Promise<void> => {
  console.log("[AI][stream] start", {
    chatId: options.chatId.toString(),
    isPrivateQuery: Boolean(options.isPrivateQuery),
    senderId: options.senderId?.toString?.(),
    contextCount: options.contextMessages?.length || 0,
    imageCount: options.imageUrls?.length || 0,
  });
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
  emitAiTyping(options, ChatEventEnum.START_TYPING_EVENT);

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
      console.error("[AI][stream] OpenRouter non-OK response", {
        status: response.status,
        chatId: options.chatId.toString(),
        errorText: errorText?.slice?.(0, 300),
      });
      throw new Error(`OpenRouter request failed: ${errorText}`);
    }
    console.log("[AI][stream] OpenRouter response accepted", {
      chatId: options.chatId.toString(),
      status: response.status,
    });

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
    console.log("[AI][stream] completed text", {
      chatId: options.chatId.toString(),
      charCount: normalizedText.length,
    });

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
    const normalizedStructuredMessage = normalizeSocketMessage(
      structuredMessage[0],
      options.chatId
    );

    emitToStreamTarget(options, ChatEventEnum.MESSAGE_COMPLETE_EVENT, {
      ...streamMetadata,
      message: normalizedStructuredMessage,
    });

    if (options.isPrivateQuery && options.senderId) {
      emitSocketEvent(
        options.req,
        options.senderId.toString(),
        ChatEventEnum.MESSAGE_RECEIVED_EVENT,
        normalizedStructuredMessage
      );
    } else {
      options.participantIds.forEach((participantId: Types.ObjectId) => {
        emitSocketEvent(
          options.req,
          participantId.toString(),
          ChatEventEnum.MESSAGE_RECEIVED_EVENT,
          normalizedStructuredMessage
        );
      });
    }
  } catch (error) {
    console.error("[AI][stream] failed", {
      chatId: options.chatId.toString(),
      error: error instanceof Error ? error.message : String(error),
    });
    emitToStreamTarget(options, ChatEventEnum.MESSAGE_STREAM_ERROR_EVENT, {
      ...streamMetadata,
      message: "AI is currently unavailable. Please try again shortly.",
    });
  } finally {
    emitAiTyping(options, ChatEventEnum.STOP_TYPING_EVENT);
  }
};
