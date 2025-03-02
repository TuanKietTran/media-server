import multer from "multer";
import * as path from "path";
import { Request } from "express";

// Configure Multer for file uploads
export const storage = multer.diskStorage({
  destination: "./uploads", // Destination folder for uploaded files
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`); // e.g., "1634567890123-456789123.jpg"
  },
});

// Create Multer instance with fileFilter
export const upload = multer({
  storage,
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null as any, true); // Cast null to any to bypass type checking
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});
