import {
  login,
  register,
  type RegisterData,
} from "@/services/auth";

export async function signUp(data: RegisterData) {
  return register(data);
}

export async function signIn(email: string, password: string) {
  return login(email, password);
}

export function signOut() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  }

  return { success: true };
}
