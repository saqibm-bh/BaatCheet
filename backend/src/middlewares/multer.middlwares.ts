import multer from "multer";
// Use memory storage so files can be streamed directly to Cloudinary.
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});
