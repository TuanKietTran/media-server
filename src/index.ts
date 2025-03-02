import express from "express";
import { apiV1 } from "./api";
import cors from "cors";
import "dotenv/config";
import {
  apiResponseMiddleware,
  errorHandler,
  notFoundMiddleware,
} from "./middleware";

const app = express();

// Apply global middleware
app.use(cors());
app.use(express.json());

app.use(apiResponseMiddleware);

// Mount the versioned router under /api/v1
app.use("/api/v1", apiV1);


// Add error-handling middleware last, without a path
app.use(errorHandler);
// Handle undefined routes
app.use(notFoundMiddleware);

export default app;
