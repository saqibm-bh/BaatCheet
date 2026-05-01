import { Schema, Types, model } from "mongoose";

export const DOCUMENT_NAME = "Message";

export default interface Message {
  _id: Types.ObjectId;
  sender: Types.ObjectId;
  content?: string;
  contentFormat?: "text" | "markdown";
  visibleOnlyTo?: Types.ObjectId | null;
  edited?: boolean;
  editedAt?: Date;
  reactions?: {
    user: Types.ObjectId;
    emoji: string;
    createdAt?: Date;
  }[];
  attachments?: {
    url: string;
    localPath?: string;
    cloudinaryPublicId?: string;
    resourceType?: "image" | "video" | "raw";
  }[];
  chat: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// define the schema for corresponding document interface
const schema = new Schema<Message>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  content: {
    type: Schema.Types.String,
    trim: false,
    maxlength: 100000,
  },

  contentFormat: {
    type: Schema.Types.String,
    enum: ["text", "markdown"],
    default: "text",
  },

  visibleOnlyTo: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  edited: {
    type: Schema.Types.Boolean,
    default: false,
  },

  editedAt: {
    type: Schema.Types.Date,
  },

  reactions: {
    type: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        emoji: {
          type: Schema.Types.String,
          trim: true,
          required: true,
          maxlength: 10,
        },
        createdAt: {
          type: Schema.Types.Date,
          default: Date.now,
        },
      },
    ],
    default: [],
  },

  attachments: {
    type: [
      {
        url: {
          type: Schema.Types.String,
          trim: true,
        },
        localPath: {
          type: Schema.Types.String,
          trim: true,
        },
        cloudinaryPublicId: {
          type: Schema.Types.String,
          trim: true,
        },
        resourceType: {
          type: Schema.Types.String,
          trim: true,
        },
      },
    ],
    default: [],
    // maxlength: 30, // max length to send a limited attachment
  },

  chat: {
    type: Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
  },
  createdAt: {
    type: Schema.Types.Date,
    default: Date.now,
  },
  updatedAt: {
    type: Schema.Types.Date,
    default: Date.now,
  },
});

// Optimize chat-scoped timelines and search result ordering.
schema.index({ chat: 1, createdAt: 1 });

export const MessageModel = model<Message>(DOCUMENT_NAME, schema);
