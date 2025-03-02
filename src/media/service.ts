import { Media } from "../../sqlite/schema";
import db from "../db";
import { eq } from "drizzle-orm";
import imageSize from "image-size";
import fs from "fs/promises";
import { NotFoundError, ValidationError } from "../model";
import path from "path";

// Define an interface for the uploaded file to avoid direct Multer dependency
export interface UploadedFile {
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
}

type Media = {
  id: number;
  originalFileName: string;
  storedFileName: string;
  mimeType: string;
  width: number;
  height: number;
  fileSize: number;
  createdAt: string;
  updatedAt: string;

  deletedAt: string | null;
};

type MediaDto = Omit<Media, "id">;

const getImageDimensions = async (file: UploadedFile) => {
  const buffer = await fs.readFile(file.path);
  const dimensions = imageSize(buffer);
  if (!dimensions.width || !dimensions.height) {
    throw new Error("Could not determine image dimensions");
  }
  return dimensions;
};

const validate = (data: MediaDto) => {
  if (!data.originalFileName) {
    throw new Error("Missing originalFileName");
  }
  if (!data.storedFileName) {
    throw new Error("Missing storedFileName");
  }
  if (!data.mimeType) {
    throw new Error("Missing mimeType");
  }
  if (!data.width) {
    throw new Error("Missing width");
  }
  if (!data.height) {
    throw new Error("Missing height");
  }
  if (!data.fileSize) {
    throw new Error("Missing fileSize");
  }
};

// Validation for create (all required fields must be present)
const validateCreate = (data: MediaDto) => {
  if (!data.originalFileName) throw new Error("Missing originalFileName");
  if (!data.storedFileName) throw new Error("Missing storedFileName");
  if (!data.mimeType) throw new Error("Missing mimeType");
  if (!data.width) throw new Error("Missing width");
  if (!data.height) throw new Error("Missing height");
  if (!data.fileSize) throw new Error("Missing fileSize");
  // Add more validations as needed
};

// Validation for update (only check provided fields)
const validateUpdate = (data: Partial<Media>) => {
  if (data.width !== undefined && typeof data.width !== "number") {
    throw new Error("Width must be a number");
  }
  if (data.height !== undefined && typeof data.height !== "number") {
    throw new Error("Height must be a number");
  }
  // Add more field-specific validations as needed
};

const getAll = async (): Promise<Media[]> => {
  return await db.select().from(Media);
};

const getById = async (id: number): Promise<Media[]> => {
  return await db.select().from(Media).where(eq(Media.id, id));
};

const create = async (model: MediaDto): Promise<Media> => {
  // Create operation (full data required)
  const mediaDto: MediaDto = model as MediaDto;
  validateCreate(mediaDto);
  const [insertedMedia] = await db.insert(Media).values(mediaDto).returning();
  return insertedMedia;
};

const update = async (model: Media) => {
    // Update operation (partial updates allowed)
    validateUpdate(model);
    const updates = { ...model } as Partial<Media>;
    delete updates.id; // Remove id from updates to avoid changing it
    const result = await db
      .update(Media)
      .set(updates)
      .where(eq(Media.id, model.id))
      .returning(); // Return the updated record
    if (result.length === 0) {
      throw new NotFoundError("No record found with the provided id");
    }
    return result[0];
};

// Assuming db, Media, eq, and NotFoundError are already defined/imported
const remove = async (id: number) => {
  // Step 1: Fetch the record to get the storedFileName
  const [record] = await db.select().from(Media).where(eq(Media.id, id)).limit(1);

  if (!record) {
    throw new NotFoundError('Media not found'); // Ensure this matches your error class
  }

  // Step 2: Delete the record from the database
  const deleteResult = await db.delete(Media).where(eq(Media.id, id));

  // Step 3: Delete the file from the uploads directory
  const filePath = path.join('./uploads', record.storedFileName);
  try {
    await fs.unlink(filePath); // Deletes the file
  } catch (err) {
    if (err.code !== 'ENOENT') { // Ignore if file is already missing
      console.error(`Failed to delete file: ${filePath}`, err);
      // Note: We don’t throw an error here to avoid breaking the response
    }
  }

  return deleteResult;
};

const softDelete = async (id: number) => {
  // Step 1: Check if the record exists and its current deletion status
  const [currentRecord] = await db
    .select()
    .from(Media)
    .where(eq(Media.id, id))
    .limit(1);

  // Step 2: Handle edge cases
  if (!currentRecord) {
    throw new NotFoundError("Media not found");
  }

  if (currentRecord.deletedAt !== null) {
    throw new ValidationError("Record is already deleted");
  }

  // Step 3: Perform the soft delete and update timestamps
  const deletedAt = new Date().toISOString();
  const updatedAt = new Date().toISOString();
  const [updatedRecord] = await db
    .update(Media)
    .set({ deletedAt, updatedAt })
    .where(eq(Media.id, id))
    .returning(); // Returns the updated record if supported by the database

  return updatedRecord;
};
const restore = async (id: number) => {
  // Step 1: Fetch the current record to check its status
  const [currentRecord] = await db
    .select()
    .from(Media)
    .where(eq(Media.id, id))
    .limit(1);

  // Step 2: Handle edge cases
  if (!currentRecord) {
    throw new NotFoundError("Media not found");
  }

  if (currentRecord.deletedAt === null) {
    throw new ValidationError("Record is not deleted");
  }

  // Step 3: Restore the record and update updatedAt
  const updatedAt = new Date().toISOString();
  const [updatedRecord] = await db
    .update(Media)
    .set({ deletedAt: null, updatedAt })
    .where(eq(Media.id, id))
    .returning(); // Returns the updated record (if supported)

  return updatedRecord;
};

// New function to handle file processing and media creation
const createFromFile = async (file: UploadedFile): Promise<Media> => {
  if (!file) {
    throw new Error("No file uploaded");
  }

  const dimensions = await getImageDimensions(file);
  if (!dimensions.width || !dimensions.height) {
    throw new Error("Could not determine image dimensions");
  }

  const mediaInput: MediaDto = {
    originalFileName: file.originalname,
    storedFileName: file.filename,
    mimeType: file.mimetype,
    width: dimensions.width,
    height: dimensions.height,
    fileSize: file.size,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  return await create(mediaInput);
};

// Merged createOrUpdate function
const createOrUpdate = async (
  model: Partial<Media> & { id?: number }
): Promise<Media> => {
  if (model.id) {
    return update(model as Media);
  } else {
    return create(model as MediaDto);
  }
};

export default {
  getAll,
  getById,
  remove,
  createOrUpdate,
  createFromFile,
  softDelete,
  restore,
};
