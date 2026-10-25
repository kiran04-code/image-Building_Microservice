import type { Request, Response } from "express";

const serviceStatus = {
  status: "ok",
  message: "Source-to-image service is running.",
};

export function readServiceStatus(_req: Request, res: Response) {
  return res.json(serviceStatus);
}
