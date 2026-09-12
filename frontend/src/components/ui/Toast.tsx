import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "success" | "error" | "info";

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
    toastHandler?.({ variant: "success", title, message, duration });
  },
  error: (title: string, message?: string, duration = 4000) => {
    toastHandler?.({ variant: "error", title, message, duration });
  },
  info: (title: string, message?: string, duration = 3000) => {
    toastHandler?.({ variant: "info", title, message, duration });
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((options: ToastOptions) => {
    const id = Date.now() + Math.random();
    const duration = options.duration ?? 3000;

    setToasts((current) => [...current, { ...options, id }]);

    window.setTimeout(() => {
      setToasts((current) =>
        current.map((toastItem) =>
          toastItem.id === id ? { ...toastItem, closing: true } : toastItem,
        ),
      );

      window.setTimeout(() => {
        setToasts((current) =>
          current.filter((toastItem) => toastItem.id !== id),
        );
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

      <div className="pointer-events-none fixed left-1/2 top-4 z-[100] flex w-[min(420px,calc(100vw-32px))] -translate-x-1/2 flex-col gap-3">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={[
              "pointer-events-auto transform rounded-[18px] border-[3px] border-ink bg-paper p-3 shadow-[5px_5px_0_#171310] transition-all duration-180 ease-out",
              item.closing
                ? "-translate-y-3 scale-[0.97] opacity-0"
                : "translate-y-0 scale-100 opacity-100",
              item.variant === "success" ? "bg-[#f4ffea]" : "",
              item.variant === "error" ? "bg-[#fff2f2]" : "",
              item.variant === "info" ? "bg-[#fff7dc]" : "",
            ].join(" ")}
            style={{
              animation: item.closing ? "none" : "toast-in-top 0.22s ease-out",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg leading-none uppercase text-ink">
                  {item.title}
                </p>
                {item.message ? (
                  <p className="mt-1 text-sm font-medium text-ink/80">
                    {item.message}
                  </p>
                ) : null}
              </div>

              <div
                className={[
                  "mt-0.5 h-3 w-3 shrink-0 rounded-full border-[2px] border-ink",
                  item.variant === "success" ? "bg-[#1fbf73]" : "",
                  item.variant === "error" ? "bg-[#ff3b30]" : "",
                  item.variant === "info" ? "bg-[#ffd400]" : "",
                ].join(" ")}
              />
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside a ToastProvider");
  }

  return context;
}
