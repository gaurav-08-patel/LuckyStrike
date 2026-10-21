import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AuthUser = {
  _id?: string;
  id?: number | string;
  phoneNumber?: string;
  profileImage?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  gender?: string;
  nationality?: string;
  countryOfResidence?: string;
  walletBalance?: number;
  pendingWithdrawalAmount?: number;
  isPhoneVerified?: boolean;
  isAdmin?: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isAuthReady: boolean;
  setUser: (user: AuthUser | null, token?: string | null) => void;
  logoutUser: () => void;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_STORAGE_KEY = "luckyStrikeToken";

const parseBooleanFlag = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", ""].includes(normalized)) {
      return false;
    }
  }

  return false;
};

const normalizeAuthUser = (value: unknown): AuthUser | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const user = value as Record<string, unknown>;

  return {
    ...user,
    walletBalance: Number(user.walletBalance ?? 0),
    pendingWithdrawalAmount: Number(user.pendingWithdrawalAmount ?? 0),
    isPhoneVerified: parseBooleanFlag(user.isPhoneVerified),
    isAdmin: parseBooleanFlag(user.isAdmin),
  } as AuthUser;
};

const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

const setStoredToken = (token: string | null) => {
  if (!token) {
    clearStoredToken();
    return;
  }

  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const bootstrapSession = async () => {
      try {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);

        if (!token) {
          setUserState(null);
          setIsAuthReady(true);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          clearStoredToken();
          setUserState(null);
          return;
        }

        const data = await response.json();
        setUserState(normalizeAuthUser(data.user));
      } catch {
        clearStoredToken();
        setUserState(null);
      } finally {
        setIsAuthReady(true);
      }
    };

    bootstrapSession();
  }, []);

  const setUser = (nextUser: AuthUser | null, token?: string | null) => {
    if (token !== undefined) {
      setStoredToken(token);
    }

    if (!nextUser) {
      clearStoredToken();
      setUserState(null);
      return;
    }

    setUserState(normalizeAuthUser(nextUser));
  };

  const logoutUser = () => {
    clearStoredToken();
    setUserState(null);
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoggedIn: isAuthReady && Boolean(user),
      isAuthReady,
      setUser,
      logoutUser,
    }),
    [user, isAuthReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}
