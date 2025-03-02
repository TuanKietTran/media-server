import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Define the 'media' table
export const Media = sqliteTable('media', {
  // Primary key, auto-incrementing integer
  id: integer('id').primaryKey({ autoIncrement: true }),

  // Original filename of the uploaded file, cannot be null
  originalFileName: text('original_file_name').notNull(),

  // Unique stored filename (e.g., a hashed or generated name), cannot be null
  storedFileName: text('stored_file_name').notNull().unique(),

  // MIME type of the file (e.g., 'image/jpeg'), cannot be null
  mimeType: text('mime_type').notNull(),

  // Width of the image in pixels, cannot be null
  width: integer('width').notNull(),

  // Height of the image in pixels, cannot be null
  height: integer('height').notNull(),

  // File size in bytes, stored as an integer, cannot be null
  fileSize: integer('file_size').notNull(),

  // Creation timestamp, stored as text in ISO8601-like format, defaults to current time
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),

  // Last updated timestamp, stored as text, defaults to current time
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),

  // Deletion timestamp for soft deletes, stored as text, null by default
  deletedAt: text('deleted_at'),
});