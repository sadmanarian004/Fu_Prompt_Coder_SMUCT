export interface AuthContext {
  userId: string;
  shopId: string;
  role: "OWNER" | "STAFF";
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export {};