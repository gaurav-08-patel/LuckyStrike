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
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("9128434870");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(52);

  useEffect(() => {
    if (!isOpen) {
      setStep("phone");
      setOtp("");
      setError("");
      setLoading(false);
      setResendCountdown(52);
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
      const response = await fetch(
        "http://localhost:5000/api/auth/request-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: fullPhone }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to send OTP.");
      }

      setStep("otp");
      setResendCountdown(52);
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
      const response = await fetch(
        "http://localhost:5000/api/auth/login-signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: fullPhone, otp }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed.");
      }

      const user = data.user;
      setUser(user);
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
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#171310]/30 p-4">
      <div className="relative w-full max-w-[620px] rounded-[30px] border-[3px] border-ink bg-[#e8e8e8] p-4 shadow-[8px_8px_0_#171310] sm:p-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute -right-3 -top-3 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-ink bg-[#f7f7f7] text-2xl font-black leading-none text-ink shadow-[3px_3px_0_#171310] transition-transform duration-150 hover:-translate-y-0.5"
        >
          ×
        </button>

        <div className="rounded-[30px] border-[3px] border-ink bg-gradient-to-r from-[#ff2d78] via-[#ff3b30] to-[#ff5d7d] px-5 py-6 text-center shadow-[5px_5px_0_#171310]">
          <p className="font-display text-[2.8rem] leading-[0.9] tracking-[-0.04em] text-white sm:text-[4.1rem]">
            SIGN-UP NOW
          </p>
          <p className="mt-2 font-display text-[1.4rem] leading-none text-white/95 sm:text-[2.4rem]">
            GET A ENTRY TO
          </p>
          <div className="mx-auto mt-3 inline-block rounded-[18px] border-[3px] border-ink bg-[#171310] px-4 py-2 shadow-[4px_4px_0_#171310]">
            <p className="font-display text-[2.1rem] leading-none tracking-[-0.04em] text-white sm:text-[3.2rem]">
              WIN ₹10,000
            </p>
          </div>
          <p className="mt-5 font-display text-[1.1rem] leading-none tracking-[0.08em] text-white sm:text-[1.8rem]">
            LIMITED TIME OFFER
          </p>
        </div>

        {step === "phone" ? (
          <div className="mt-6 rounded-[26px] border-[3px] border-ink bg-[#dfe0e0] p-4 sm:p-5">
            <p className="mb-5 text-center font-display text-[2rem] leading-none tracking-[-0.04em] text-ink sm:text-[2.5rem]">
              ENTER MOBILE NO.
            </p>

            <div className="grid grid-cols-[120px_1fr] gap-3">
              <select
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
                className="h-[62px] rounded-[16px] border-[3px] border-ink bg-[#f7f7f7] px-3 text-lg font-bold text-ink outline-none"
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
                className="h-[62px] rounded-[16px] border-[3px] border-ink bg-[#f7f7f7] px-4 text-lg font-medium text-ink outline-none placeholder:text-ink/45"
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
            <p className="text-center text-[1.05rem] font-bold text-ink sm:text-[1.3rem]">
              Enter the 8 digit OTP sent to
            </p>
            <p className="mt-2 text-center text-[2rem] font-black leading-none text-[#4a4ae6] sm:text-[2.6rem]">
              +{fullPhone.replace(/\D/g, "")}
            </p>

            <input
              value={otp}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              maxLength={6}
              placeholder="Enter OTP"
              className="mt-5 h-[62px] w-full rounded-[16px] border-[3px] border-ink bg-[#f7f7f7] px-4 text-center text-2xl font-black tracking-[0.25em] text-ink outline-none placeholder:text-ink/40"
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
  );
}

export default AuthModal;
