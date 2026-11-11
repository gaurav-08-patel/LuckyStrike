import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

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

const TOKEN_STORAGE_KEY = 'luckyStrikeToken';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const parseBooleanFlag = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes'].includes(normalized)) return true;
    if (['0', 'false', 'no', ''].includes(normalized)) return false;
  }

  return false;
};

const normalizeAuthUser = (value: unknown): AuthUser | null => {
  if (!value || typeof value !== 'object') return null;

  const user = value as Record<string, unknown>;

  return {
    ...user,
    walletBalance: Number(user.walletBalance ?? user.wallet_balance ?? 0),
    pendingWithdrawalAmount: Number(user.pendingWithdrawalAmount ?? user.pending_withdrawal_amount ?? 0),
    isPhoneVerified: parseBooleanFlag(user.isPhoneVerified ?? user.is_phone_verified),
    isAdmin: parseBooleanFlag(user.isAdmin ?? user.is_admin),
  } as AuthUser;
};

const clearStoredToken = async () => {
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
};

const setStoredToken = async (token: string | null) => {
  if (!token) {
    await clearStoredToken();
    return;
  }

  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

        if (!token) {
          if (isMounted) {
            setUserState(null);
            setIsAuthReady(true);
          }
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          await clearStoredToken();
          if (isMounted) {
            setUserState(null);
          }
          return;
        }

        const data = await response.json();
        const nextUser = normalizeAuthUser(data.user ?? data);

        if (isMounted) {
          setUserState(nextUser);
        }
      } catch {
        await clearStoredToken();
        if (isMounted) {
          setUserState(null);
        }
      } finally {
        if (isMounted) {
          setIsAuthReady(true);
        }
      }
    };

    void bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const setUser = async (nextUser: AuthUser | null, token?: string | null) => {
    if (token !== undefined) {
      await setStoredToken(token);
    }

    if (!nextUser) {
      await clearStoredToken();
      setUserState(null);
      return;
    }

    setUserState(normalizeAuthUser(nextUser));
  };

  const logoutUser = async () => {
    await clearStoredToken();
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
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
}
