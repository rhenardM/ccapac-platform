"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  login as loginRequest,
  loginWithGoogle as googleLoginRequest,
  type LoginResponse,
  type User,
} from "@/services/auth";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<User>;
  loginWithGoogle: (
    credential: string
  ) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

const TOKEN_KEY = "token";
const USER_KEY = "user";

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/session", {
        method: "DELETE",
      });
    } catch (error) {
      console.error(
        "Erreur de suppression du cookie :",
        error
      );
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setLoading(false);
    }
  }, []);

  const saveSession = useCallback(
    async (result: LoginResponse): Promise<User> => {
      if (!result.token || !result.user) {
        throw new Error(
          "Réponse de connexion invalide"
        );
      }

      const sessionResponse = await fetch(
        "/api/auth/session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: result.token,
          }),
        }
      );

      if (!sessionResponse.ok) {
        throw new Error(
          "Impossible de créer la session"
        );
      }

      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(
        USER_KEY,
        JSON.stringify(result.user)
      );

      setUser(result.user);
      setLoading(false);

      return result.user;
    },
    []
  );

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);

    if (!token || !savedUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const authenticatedUser = JSON.parse(
        savedUser
      ) as User;

      if (
        !authenticatedUser.id ||
        !authenticatedUser.email
      ) {
        throw new Error(
          "Informations utilisateur invalides"
        );
      }

      setUser(authenticatedUser);
    } catch (error) {
      console.error(
        "Erreur de restauration de session :",
        error
      );

      await logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<User> => {
      const result = await loginRequest(
        email,
        password
      );

      return saveSession(result);
    },
    [saveSession]
  );

  const loginWithGoogle = useCallback(
    async (credential: string): Promise<User> => {
      const result = await googleLoginRequest(
        credential
      );

      return saveSession(result);
    },
    [saveSession]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth doit être utilisé dans AuthProvider"
    );
  }

  return context;
}
