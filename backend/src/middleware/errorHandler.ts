import { Request, Response, NextFunction } from "express";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ message: `No route matches ${req.method} ${req.path}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("[errorHandler]", err);

  if (err?.name === "ZodError") {
    return res.status(400).json({ message: err.issues?.[0]?.message ?? "Invalid request." });
  }

  const status = err?.status ?? 500;
  const message =
    status === 500
      ? "Something went wrong on our end. Please try again."
      : err?.message ?? "Request failed.";

  res.status(status).json({ message });
}