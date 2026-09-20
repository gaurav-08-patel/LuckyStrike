import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { countryCodes } from "../data/countryCodes";
import { toast } from "./ui/Toast";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(52);
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep("phone");
      setOtp("");
      setError("");
      setLoading(false);
      setResendCountdown(52);
      setPreviewOtp(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step !== "otp") return;

    if (resendCountdown <= 0) return;

    const timer = window.setTimeout(() => {
      setResendCountdown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [step, resendCountdown]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const fullPhone = useMemo(
    () => `${countryCode}${phoneNumber.replace(/\D/g, "")}`,
    [countryCode, phoneNumber],
  );

  const requestOtp = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, "");

    if (!cleanPhone || cleanPhone.length < 8) {
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: fullPhone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to send OTP.");
      }

      setStep("otp");
      setResendCountdown(52);
      setPreviewOtp(data?.otp ?? null);
      toast.success("OTP sent", "Verification code sent to your phone.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      toast.error(
        "OTP request failed",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;

    await requestOtp();
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: fullPhone, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed.");
      }

      const user = data.user;
      setUser(user, data.token ?? null);
      setPreviewOtp(null);
      toast.success(
        data.isNewUser ? "Account created" : "Login successful",
        data.isNewUser
          ? "Welcome! Please complete your details on the next step."
          : "You are now logged in.",
      );

      onClose();

      if (data.redirectUrl) {
        navigate(data.redirectUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
      toast.error(
        "Verification failed",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#171310]/30 p-3 sm:p-4">
      <div className="relative w-full max-w-[620px]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute -right-2 -top-2 z-20 flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-ink bg-[#f7f7f7] text-2xl font-black leading-none text-ink shadow-[3px_3px_0_#171310] transition-transform duration-150 hover:-translate-y-0.5 sm:-right-3 sm:-top-3"
        >
          ×
        </button>

        <div className="max-h-[90vh] overflow-y-auto rounded-[30px] border-[3px] border-ink bg-[#e8e8e8] p-3 shadow-[8px_8px_0_#171310] sm:p-5">
          <div className="rounded-[30px] border-[3px] border-ink bg-gradient-to-r from-[#ff2d78] via-[#ff3b30] to-[#ff5d7d] px-4 py-5 text-center shadow-[5px_5px_0_#171310] sm:px-5 sm:py-6">
            <p className="font-display text-[2.1rem] leading-[0.9] tracking-[-0.04em] text-white sm:text-[4.1rem]">
              SIGN-UP NOW
            </p>
            <p className="mt-2 font-display text-[1.15rem] leading-none text-white/95 sm:text-[2.4rem]">
              GET A ENTRY TO
            </p>
            <div className="mx-auto mt-3 inline-block rounded-[18px] border-[3px] border-ink bg-[#171310] px-4 py-2 shadow-[4px_4px_0_#171310]">
              <p className="font-display text-[1.8rem] leading-none tracking-[-0.04em] text-white sm:text-[3.2rem]">
                WIN ₹10,000
              </p>
            </div>
            <p className="mt-5 font-display text-[0.95rem] leading-none tracking-[0.08em] text-white sm:text-[1.8rem]">
              LIMITED TIME OFFER
            </p>
          </div>

          {step === "phone" ? (
            <div className="mt-6 rounded-[26px] border-[3px] border-ink bg-[#dfe0e0] p-4 sm:p-5">
              <p className="mb-5 text-center font-display text-[1.7rem] leading-none tracking-[-0.04em] text-ink sm:text-[2.5rem]">
                ENTER MOBILE NO.
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_1fr]">
                <select
                  value={countryCode}
                  onChange={(event) => setCountryCode(event.target.value)}
                  className="h-[56px] rounded-[16px] border-[3px] border-ink bg-[#f7f7f7] px-3 text-base font-bold text-ink outline-none sm:h-[62px] sm:text-lg"
                >
                  {countryCodes.map((country) => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </select>

                <input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="Mobile Number"
                  className="h-[56px] rounded-[16px] border-[3px] border-ink bg-[#f7f7f7] px-4 text-base font-medium text-ink outline-none placeholder:text-ink/45 sm:h-[62px] sm:text-lg"
                />
              </div>

              {error ? (
                <p className="mt-3 text-sm font-bold text-[#ff3b30]">{error}</p>
              ) : null}

              <button
                type="button"
                disabled={loading}
                onClick={requestOtp}
                className="mt-5 flex h-[62px] w-full items-center justify-center rounded-[16px] border-[3px] border-ink bg-[#dfe0e0] text-center font-display text-[1.7rem] leading-none tracking-[0.06em] text-ink shadow-[3px_3px_0_#171310] transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[2px_2px_0_#171310] disabled:opacity-70"
              >
                {loading ? "SENDING..." : "SEND OTP"}
              </button>

              <p className="mt-5 text-center text-sm font-bold text-ink/75">
                <span className="text-[#ff3b30]">*</span>Offer valid for new
                users. Existing users will be logged in normally.
              </p>
            </div>
          ) : (
            <div className="mt-6 rounded-[26px] border-[3px] border-ink bg-[#dfe0e0] p-4 sm:p-5">
              <p className="text-center text-[0.95rem] font-bold text-ink sm:text-[1.3rem]">
                Enter the 8 digit OTP sent to
              </p>
              <p className="mt-2 break-all text-center text-[1.5rem] font-black leading-none text-[#4a4ae6] sm:text-[2.6rem]">
                +{fullPhone.replace(/\D/g, "")}
              </p>

              {previewOtp ? (
                <div className="mt-3 rounded-[12px] border-[2px] border-ink bg-[#fff] p-3 text-center">
                  <p className="text-sm font-bold text-ink">
                    DEV OTP (preview)
                  </p>
                  <p className="mt-1 text-2xl font-black tracking-[0.18em] text-ink">
                    {previewOtp}
                  </p>
                </div>
              ) : null}

              <input
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                placeholder="Enter OTP"
                className="mt-5 h-[56px] w-full rounded-[16px] border-[3px] border-ink bg-[#f7f7f7] px-4 text-center text-xl font-black tracking-[0.2em] text-ink outline-none placeholder:text-ink/40 sm:h-[62px] sm:text-2xl sm:tracking-[0.25em]"
              />

              {error ? (
                <p className="mt-3 text-sm font-bold text-[#ff3b30]">{error}</p>
              ) : null}

              <button
                type="button"
                disabled={loading}
                onClick={verifyOtp}
                className="mt-5 flex h-[62px] w-full items-center justify-center rounded-[16px] border-[3px] border-ink bg-[#dfe0e0] text-center font-display text-[1.7rem] leading-none tracking-[0.06em] text-ink shadow-[3px_3px_0_#171310] transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[2px_2px_0_#171310] disabled:opacity-70"
              >
                {loading ? "VERIFYING..." : "VERIFY"}
              </button>

              <button
                type="button"
                disabled={resendCountdown > 0 || loading}
                onClick={handleResendOtp}
                className="mt-5 block w-full text-center text-[1.1rem] font-bold text-ink transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resendCountdown > 0 ? (
                  <>
                    Resend OTP in{" "}
                    <span className="font-black">
                      00:{String(resendCountdown).padStart(2, "0")}
                    </span>{" "}
                    seconds
                  </>
                ) : (
                  <span className="font-black">Resend OTP</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
