/**
 * Better Auth was removed. Authentication is now handled by the Express API
 * and the JWT helpers in auth-server.ts / AuthContext.tsx.
 */
export { getUser, getSession, isAdmin } from "@/lib/auth-server";
