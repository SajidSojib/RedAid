import { type Request, type Response, type NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { Prisma } from "../../generated/prisma/client";

const globalErrorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = err.statusCode || 500;
  let errCause = err.cause;

  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    errCause = err.message;
    err.message = "Required field is missing or invalid";
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = 400;
      errCause = err.message;
      err.message = "Unique constraint failed";
    } else if (err.code === "P2003") {
      statusCode = 400;
      errCause = err.message;
      err.message = "Foreign key constraint failed";
    } else if (err.code === "P2025") {
      statusCode = 404;
      errCause = err.message;
      err.message = "Record not found";
    }
  }

  res.status(statusCode).json({
    success: false,
    message: err.message,
    cause: errCause,
    error: err,
  });
};

export default globalErrorHandler;
