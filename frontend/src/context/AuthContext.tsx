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
  id?: string;
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
  setUser: (user: AuthUser | null) => void;
  logoutUser: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "luckyStrikeUser";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEY);
      return storedUser ? (JSON.parse(storedUser) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const setUser = (nextUser: AuthUser | null) => {
    setUserState(nextUser);
  };

  const logoutUser = () => {
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
