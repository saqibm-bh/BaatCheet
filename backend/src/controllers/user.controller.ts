import { Request, Response } from "express";
import asyncHandler from "../helpers/asyncHandler";
import userRepo from "../database/repositories/userRepo";
import { AuthFailureError, BadRequestError, InternalError } from "../core/ApiError";
import { RoleCode } from "../database/model/Role";
import User from "../database/model/User";
import bcrypt from "bcrypt";
import { createTokens } from "./auth/authUtils";
import {
  filterUserData,
  getLocalFilePathFromStaticUrl,
  removeLocalFile,
} from "../helpers/utils";
import { SuccessResponse } from "../core/ApiResponse";
import {
  cloudinary as cloudinaryConfig,
  cookieValidity,
  environment,
  tokenInfo,
} from "../config";
import { ProtectedRequest } from "../types/app-request";
import { Types } from "mongoose";
import {
  deleteFromCloudinary,
  uploadBufferToCloudinary,
  validateUploadFileForCloudinary,
} from "../helpers/cloudinary";

const signUp = asyncHandler(async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  const existingUserEmail = await userRepo.findByEmail(email);
  if (existingUserEmail) {
    throw new BadRequestError("email already exists");
  }

  const existingUserUsername = await userRepo.findByUsername(username);
  if (existingUserUsername) {
    throw new BadRequestError("username already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // create a new user
  const user = await userRepo.create(
    {
      username,
      email,
      password: hashedPassword,
    } as User,
    RoleCode.USER
  );

  const tokens = await createTokens(user);
  const userData = await filterUserData(user);

  new SuccessResponse("signup successful", {
    user: userData,
    tokens,
  }).send(res);
});

const login = asyncHandler(async (req: Request, res: Response) => {
  const { userId, password } = req.body;

  const user = await userRepo.findByEmailOrUsername(userId);
  if (!user) throw new BadRequestError("invalid email/username");

  if (!password) throw new BadRequestError("no credentials provided");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AuthFailureError("Invalid credentials");

  // just renamed the password to pass "password" var is used before
  const { password: pass, status, ...filteredUser } = user;

  const tokens = await createTokens(user);

  const options = {
    httpOnly: true,
    secure: environment === "production",
  };

  // attach the cookies to res object
  res
    .cookie("accessToken", tokens.accessToken, options)
    .cookie("refreshToken", tokens.refreshToken, options);

  new SuccessResponse("login successful", {
    user: filteredUser,
    tokens,
  }).send(res);
});

const logout = asyncHandler(async (req: Request, res: Response) => {
  const options = {
    httpOnly: true,
    secure: environment === "production",
  };

  res.clearCookie("accessToken", options).clearCookie("refreshToken", options);

  new SuccessResponse("logout successful", {}).send(res, {});
});

const updateProfile = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const currentUser = req.user;
    const { username, bio } = req.body as { username?: string; bio?: string };
    const avatarFile = req.file as Express.Multer.File | undefined;

    const updates: Partial<
      Pick<User, "username" | "bio" | "avatarUrl" | "avatarPublicId">
    > = {};

    if (typeof username === "string") {
      const normalizedUsername = username.trim().toLowerCase();

      if (!normalizedUsername) {
        throw new BadRequestError("username is required");
      }

      const existingUser = await userRepo.findByUsername(normalizedUsername);
      if (
        existingUser &&
        existingUser._id.toString() !== currentUser._id.toString()
      ) {
        throw new BadRequestError("username already exists");
      }

      updates.username = normalizedUsername;
    }

    if (typeof bio === "string") {
      updates.bio = bio.trim();
    }

    if (avatarFile) {
      validateUploadFileForCloudinary(avatarFile, {
        allowedResourceTypes: ["image"],
      });

      const uploadedAvatar = await uploadBufferToCloudinary({
        fileBuffer: avatarFile.buffer,
        folder: `${cloudinaryConfig.folder}/avatars`,
        resourceType: "image",
        originalFileName: avatarFile.originalname,
      });

      updates.avatarUrl = uploadedAvatar.secureUrl;
      updates.avatarPublicId = uploadedAvatar.publicId;
    }

    if (!Object.keys(updates).length) {
      throw new BadRequestError("no profile fields provided");
    }

    if (avatarFile && currentUser.avatarUrl) {
      if (currentUser.avatarPublicId) {
        await deleteFromCloudinary(currentUser.avatarPublicId, "image");
      } else {
        const previousAvatarLocalPath = getLocalFilePathFromStaticUrl(
          currentUser.avatarUrl
        );

        if (previousAvatarLocalPath) {
          removeLocalFile(previousAvatarLocalPath);
        }
      }
    }

    const updatedUser = await userRepo.updateProfileFields(
      currentUser._id as Types.ObjectId,
      updates
    );

    if (!updatedUser) {
      throw new InternalError("failed to update profile");
    }

    const userData = await filterUserData(updatedUser);

    new SuccessResponse("profile updated successfully", { user: userData }).send(
      res
    );
  }
);

export { signUp, login, logout, updateProfile };
