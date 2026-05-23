// Augment Express Request to carry the authenticated userId
declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export {};

