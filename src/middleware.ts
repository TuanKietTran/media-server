import { ApiResponse, HttpStatusCode, NotFoundError, UnauthorizedError, ValidationError } from "./model";
import { Request, Response, NextFunction } from 'express';

declare module "express-serve-static-core" {
  interface Response {
    sendApiResponse<T>(data: T, code: HttpStatusCode, msg?: string): void;
  }
}


export function apiResponseMiddleware(req: Request, res: Response, next: NextFunction) {
  res.sendApiResponse = function<T>(data: T, code: HttpStatusCode, msg?: string) {
    const apiResponse: ApiResponse<T> = { data, code, msg };
    res.status(code).json(apiResponse);
  };
  next();
}

export function notFoundMiddleware(req: Request, res: Response, next: NextFunction) {
  const message = 'API route not found';
  res.sendApiResponse<null>(null, HttpStatusCode.NotFound, message);
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof NotFoundError) {
    return res.sendApiResponse(null, HttpStatusCode.NotFound, err.message);
  } else if (err instanceof ValidationError) {
    return res.sendApiResponse(null, HttpStatusCode.BadRequest, err.message);
  } else if (err instanceof UnauthorizedError) {
    return res.sendApiResponse(null, HttpStatusCode.Unauthorized, err.message);
  }

  // Default to 500 for unhandled errors
  res.sendApiResponse(null, HttpStatusCode.InternalServerError, err.message);
}

