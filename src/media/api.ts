import express, { Request, Response, NextFunction } from "express";
import service, { UploadedFile } from "./service";
import { HttpStatusCode, NotFoundError, ValidationError } from "../model";
import { upload } from "./middleware";

const api = express.Router();

/**
 * @openapi
 * /:
 *   get:
 *     summary: Retrieve all media records
 *     description: Fetches a list of all media records from the database.
 *     responses:
 *       200:
 *         description: A list of media records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   originalFileName:
 *                     type: string
 *                   storedFileName:
 *                     type: string
 *                   mimeType:
 *                     type: string
 *                   width:
 *                     type: integer
 *                   height:
 *                     type: integer
 *                   fileSize:
 *                     type: integer
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   deletedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 */
api.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.getAll();
    res.sendApiResponse(result, HttpStatusCode.OK);
  } catch (err) {
    next(err); // Pass any errors to the error-handling middleware
  }
});

/**
 * @openapi
 * /:
 *   post:
 *     summary: Upload a new media file
 *     description: Uploads a new media file and stores it in the database.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Media file uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 originalFileName:
 *                   type: string
 *                 storedFileName:
 *                   type: string
 *                 mimeType:
 *                   type: string
 *                 width:
 *                   type: integer
 *                 height:
 *                   type: integer
 *                 fileSize:
 *                   type: integer
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: No file uploaded or validation error
 */
api.post("/", upload.single("file"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file as UploadedFile;
    if (!file) {
      throw new ValidationError("No file uploaded");
    }
    const media = await service.createFromFile(file);
    res.sendApiResponse(media, HttpStatusCode.Created, "Media stored");
  } catch (err) {
    next(err); // Pass errors to the middleware
  }
});

/**
 * @openapi
 * /{id}:
 *   put:
 *     summary: Update a media record by ID
 *     description: Updates the specified fields of a media record.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the media record to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               originalFileName:
 *                 type: string
 *               storedFileName:
 *                 type: string
 *               mimeType:
 *                 type: string
 *               width:
 *                 type: integer
 *               height:
 *                 type: integer
 *               fileSize:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Media record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid ID or validation error
 *       404:
 *         description: Media not found
 */
api.put("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new ValidationError("Invalid ID");
    }

    const updates = req.body;
    const result = await service.createOrUpdate({ id, ...updates });

    if (!result) {
      throw new NotFoundError("Media not found");
    }

    res.sendApiResponse({ message: "Media updated" }, HttpStatusCode.OK);
  } catch (err) {
    next(err); // Pass errors to the middleware
  }
});

/**
 * @openapi
 * /{id}:
 *   delete:
 *     summary: Permanently delete a media record by ID
 *     description: Deletes the media record and its associated file from the server.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the media record to delete
 *     responses:
 *       200:
 *         description: Media record deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Media not found
 */
api.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new ValidationError("Invalid ID");
    }

    const result = await service.remove(id);

    if (result.rowsAffected === 0) {
      throw new NotFoundError("Media not found");
    }

    res.sendApiResponse(null, HttpStatusCode.OK, "Media deleted");
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /{id}/soft-delete:
 *   patch:
 *     summary: Soft delete a media record by ID
 *     description: Marks the media record as deleted by setting the `deletedAt` field.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the media record to soft delete
 *     responses:
 *       200:
 *         description: Media record soft-deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Media not found
 */
api.patch("/:id/soft-delete", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new ValidationError("Invalid ID");
    }

    const result = await service.softDelete(id);

    if (!result) {
      throw new NotFoundError("Media not found");
    }

    res.sendApiResponse(null, HttpStatusCode.OK, "Media soft-deleted");
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted media record by ID
 *     description: Restores a soft-deleted media record by clearing the `deletedAt` field.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the media record to restore
 *     responses:
 *       200:
 *         description: Media record restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Media not found
 */
api.patch("/:id/restore", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new ValidationError("Invalid ID");
    }

    const result = await service.restore(id);

    if (!result) {
      throw new NotFoundError("Media not found");
    }

    res.sendApiResponse(null, HttpStatusCode.OK, "Media restored");
  } catch (err) {
    next(err);
  }
});

export default api;