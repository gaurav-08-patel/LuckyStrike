import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import { toast } from "../components/ui/Toast";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  invitationCode: "",
};

function WhatsAppVerifyPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!agreed) {
      setError("Please agree to the terms and privacy policy.");
      return;
    }

    const userId = user.id ?? user._id;

    if (!userId) {
      setError("User session is missing. Please log in again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/${userId}/profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("luckyStrikeToken") || ""}`,
          },
          body: JSON.stringify({
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            invitationCode: form.invitationCode.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save your details.");
      }

      setUser({ ...user, ...data.user });
      toast.success("Profile saved", "Your account details have been updated.");
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      toast.error(
        "Profile update failed",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,94,188,0.38)_0%,_rgba(255,169,210,0.26)_18%,_rgba(255,232,242,0.9)_42%,_rgba(245,244,244,0.98)_65%,_rgba(239,236,233,1)_100%)] text-ink">
      <SiteHeader
        brand={
          <>
            Lucky<span className="text-red">Strike</span>
          </>
        }
      />

      <section className="flex min-h-[calc(100vh-80px)] items-start justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[440px]">
          <div className="mx-auto rounded-[28px] border-[3px] border-ink bg-gradient-to-br from-[#ff2d78] via-[#ff3d8c] to-[#ff5d7d] px-5 py-5 text-center shadow-[6px_6px_0_#171310] sm:px-6">
            <p className="font-display text-[2.4rem] leading-[0.9] tracking-[-0.05em] text-white sm:text-[3.3rem]">
              SIGN-UP NOW
            </p>
            <p className="mt-2 font-display text-[1.2rem] leading-none tracking-[-0.02em] text-white/95 sm:text-[1.75rem]">
              GET A ENTRY TO
            </p>
            <div className="mx-auto mt-3 inline-block rounded-[18px] border-[3px] border-ink bg-[#171310] px-4 py-2 shadow-[4px_4px_0_#171310]">
              <p className="font-display text-[1.75rem] leading-none tracking-[-0.04em] text-white sm:text-[2.75rem]">
                WIN ₹10,000
              </p>
            </div>
            <p className="mt-4 font-display text-[0.95rem] leading-none tracking-[0.08em] text-white sm:text-[1.3rem]">
              LIMITED TIME OFFER
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-[24px] border-[3px] border-ink bg-[#f1f1f1] p-4 shadow-[5px_5px_0_#171310] sm:p-5"
          >
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-ink">
                  First Name <span className="text-[#ff3b30]">*</span>
                </span>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="h-[52px] w-full rounded-[14px] border-[3px] border-ink bg-[#f7f7f7] px-3 text-base font-medium text-ink outline-none placeholder:text-ink/45"
                  placeholder="First Name"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-ink">
                  Last Name <span className="text-[#ff3b30]">*</span>
                </span>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="h-[52px] w-full rounded-[14px] border-[3px] border-ink bg-[#f7f7f7] px-3 text-base font-medium text-ink outline-none placeholder:text-ink/45"
                  placeholder="Last Name"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-ink">
                  Email <span className="text-[#ff3b30]">*</span>
                </span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="h-[52px] w-full rounded-[14px] border-[3px] border-ink bg-[#f7f7f7] px-3 text-base font-medium text-ink outline-none placeholder:text-ink/45"
                  placeholder="Email"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-ink">
                  Invitation Code (Optional)
                </span>
                <input
                  name="invitationCode"
                  value={form.invitationCode}
                  onChange={handleChange}
                  className="h-[52px] w-full rounded-[14px] border-[3px] border-ink bg-[#f7f7f7] px-3 text-base font-medium text-ink outline-none placeholder:text-ink/45"
                  placeholder="Invitation Code"
                />
              </label>

              <div className="block">
                <span className="mb-1 block text-sm font-semibold text-ink">
                  Registered WhatsApp Number:
                </span>
                <div className="flex h-[52px] items-center rounded-[14px] border-[3px] border-ink bg-[#f7f7f7] px-3 text-base font-bold text-ink">
                  +{String(user.phoneNumber || "").replace(/\D/g, "")}
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm font-medium text-ink">
              <span className="text-[#ff3b30]">*</span> Mandatory Fields
            </div>

            <label className="mt-4 flex items-start gap-3 text-sm font-medium text-ink">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[2px] border-ink accent-[#ff3d8c]"
              />
              <span>
                I agree to the{" "}
                <a
                  href="/user-agreement"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline"
                >
                  User Agreement
                </a>{" "}
                and{" "}
                <a
                  href="/privacy-policy"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline"
                >
                  Privacy Policy
                </a>
              </span>
            </label>

            {error ? (
              <p className="mt-3 text-sm font-bold text-[#ff3b30]">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 flex h-[58px] w-full items-center justify-center rounded-[16px] border-[3px] border-ink bg-[#3f57d8] text-center font-display text-[1.6rem] leading-none tracking-[0.04em] text-white shadow-[4px_4px_0_#171310] transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[2px_2px_0_#171310] disabled:opacity-75"
            >
              {loading ? "SIGNING UP..." : "SIGN-UP"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default WhatsAppVerifyPage;
