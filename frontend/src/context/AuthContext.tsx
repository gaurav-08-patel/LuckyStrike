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
  firstName?: string;
  lastName?: string;
  email?: string;
  gender?: string;
  nationality?: string;
  countryOfResidence?: string;
  walletBalance?: number;
  isPhoneVerified?: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  setUser: (user: AuthUser | null, token?: string | null) => void;
  logoutUser: () => void;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_STORAGE_KEY = "luckyStrikeToken";

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

  useEffect(() => {
    const bootstrapSession = async () => {
      try {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);

        if (!token) {
          setUserState(null);
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
        setUserState(data.user ?? null);
      } catch {
        clearStoredToken();
        setUserState(null);
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

    setUserState(nextUser);
  };

  const logoutUser = () => {
    clearStoredToken();
    setUserState(null);
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoggedIn: Boolean(user),
      setUser,
      logoutUser,
    }),
    [user],
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
