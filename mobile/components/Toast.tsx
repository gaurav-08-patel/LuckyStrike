import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';

type ToastVariant = 'success' | 'error' | 'info';

type ToastOptions = {
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
};

type ToastItem = ToastOptions & {
  id: number;
  closing?: boolean;
};

type ToastContextType = {
  showToast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastHandler: ((options: ToastOptions) => void) | null = null;

export const toast = {
  success: (title: string, message?: string, duration = 3000) => {
    toastHandler?.({ variant: 'success', title, message, duration });
  },
  error: (title: string, message?: string, duration = 4000) => {
    toastHandler?.({ variant: 'error', title, message, duration });
  },
  info: (title: string, message?: string, duration = 3000) => {
    toastHandler?.({ variant: 'info', title, message, duration });
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((options: ToastOptions) => {
    const id = Date.now() + Math.random();
    const duration = options.duration ?? 3000;

    setToasts((current) => [...current, { ...options, id }]);

    setTimeout(() => {
      setToasts((current) =>
        current.map((toastItem) =>
          toastItem.id === id ? { ...toastItem, closing: true } : toastItem,
        ),
      );

      setTimeout(() => {
        setToasts((current) => current.filter((toastItem) => toastItem.id !== id));
      }, 180);
    }, duration);
  }, []);

  useEffect(() => {
    toastHandler = showToast;

    return () => {
      toastHandler = null;
    };
  }, [showToast]);

  const contextValue = useMemo<ToastContextType>(
    () => ({ showToast }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {toasts.length > 0 ? (
        <View style={styles.container} pointerEvents='none'>
          {toasts.map((item) => (
            <View
              key={item.id}
              style={[
                styles.toast,
                item.variant === 'success' && styles.successToast,
                item.variant === 'error' && styles.errorToast,
                item.variant === 'info' && styles.infoToast,
                item.closing && styles.toastClosing,
              ]}
            >
              <View style={styles.toastContent}>
                <Text style={styles.title}>{item.title}</Text>
                {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
              </View>

              <View
                style={[
                  styles.dot,
                  item.variant === 'success' && styles.successDot,
                  item.variant === 'error' && styles.errorDot,
                  item.variant === 'info' && styles.infoDot,
                ]}
              />
            </View>
          ))}
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside a ToastProvider');
  }

  return context;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    left: 18,
    right: 18,
    zIndex: 999,
    gap: 10,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 2,
    borderColor: '#171310',
    borderRadius: 18,
    backgroundColor: '#fffaf6',
    shadowColor: '#171310',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
  },
  successToast: {
    backgroundColor: '#ebfff0',
    borderColor: '#1f5f3f',
  },
  errorToast: {
    backgroundColor: '#fff0f0',
    borderColor: '#8b2e2e',
  },
  infoToast: {
    backgroundColor: '#fff7d8',
    borderColor: '#8a6b00',
  },
  toastClosing: {
    opacity: 0,
    transform: [{ translateY: -18 }, { scale: 0.96 }],
  },
  toastContent: {
    flex: 1,
  },
  title: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: '#171310',
  },
  message: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 16,
    color: '#2e2927',
    fontWeight: '700',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#171310',
    marginTop: 2,
    shadowColor: '#171310',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
  },
  successDot: {
    backgroundColor: '#1a7f4d',
  },
  errorDot: {
    backgroundColor: '#d93030',
  },
  infoDot: {
    backgroundColor: '#d49b00',
  },
});
