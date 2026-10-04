import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { countries } from "../data/countries";

type ProfileForm = {
  firstName?: string;
  lastName?: string;
  email?: string;
  gender?: string;
  nationality?: string;
  countryOfResidence?: string;
};

export default function ProfileTab() {
  const { user, setUser } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      gender: (user as any)?.gender ?? "",
      nationality: (user as any)?.nationality ?? "",
      countryOfResidence: (user as any)?.countryOfResidence ?? "",
    });
  }, [user]);

  const updateProfile = async () => {
    setLoading(true);
    setError(null);
    if (!user?.id) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    try {
      const token = localStorage.getItem("luckyStrikeToken");
      const payload: Partial<ProfileForm> = {};
      [
        "firstName",
        "lastName",
        "email",
        "gender",
        "nationality",
        "countryOfResidence",
      ].forEach((k) => {
        const v = (form as any)[k];
        if (v !== undefined) (payload as any)[k] = v;
      });

      const res = await fetch(`${API_BASE_URL}/api/users/${user?.id}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.message || `Update failed (${res.status})`);
        throw new Error(body?.message || "Failed to update");
      }

      // After successful update, refresh the authoritative user from /api/auth/me
      await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      })
        .then((r) => r.ok && r.json())
        .then((d) => {
          if (d?.user) setUser(d.user);
        })
        .catch(() => {
          // fallback: try to use returned body from PUT if present
          res
            .json()
            .then((data) => setUser(data.user ?? null))
            .catch(() => {});
        });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      // set generic error if none set
      if (!error) setError(err?.message ?? "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[24px] border-[3px] border-ink bg-[#fffaf7] p-6 shadow-[5px_5px_0_#171310]">
      <h2 className="font-display text-[2rem] uppercase leading-none tracking-[-0.05em] text-ink">
        Profile
      </h2>
      <p className="mt-3 text-sm text-ink/70">
        Personal details and account information.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col">
          <span className="text-xs font-black uppercase text-ink/70">
            First name
          </span>
          <input
            value={form.firstName}
            onChange={(e) =>
              setForm((s) => ({ ...s, firstName: e.target.value }))
            }
            className="mt-1 rounded-md border px-3 py-2"
            disabled={!editing}
          />
        </label>

        <label className="flex flex-col">
          <span className="text-xs font-black uppercase text-ink/70">
            Last name
          </span>
          <input
            value={form.lastName}
            onChange={(e) =>
              setForm((s) => ({ ...s, lastName: e.target.value }))
            }
            className="mt-1 rounded-md border px-3 py-2"
            disabled={!editing}
          />
        </label>

        <label className="flex flex-col sm:col-span-2">
          <span className="text-xs font-black uppercase text-ink/70">
            Email
          </span>
          <input
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            className="mt-1 rounded-md border px-3 py-2"
            disabled={!editing}
          />
        </label>

        {!editing && (
          <label className="flex flex-col sm:col-span-2">
            <span className="text-xs font-black uppercase text-ink/70">Phone</span>
            <div className="mt-1 rounded-md border px-3 py-2">{user?.phoneNumber ?? ""}</div>
          </label>
        )}

        <label className="flex flex-col">
          <span className="text-xs font-black uppercase text-ink/70">
            Gender
          </span>
          <select
            value={form.gender ?? ""}
            onChange={(e) => setForm((s) => ({ ...s, gender: e.target.value }))}
            className="mt-1 rounded-md border px-3 py-2"
            disabled={!editing}
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </label>

        {/* Phone number is not editable via this endpoint; hide the field. */}

        <label className="flex flex-col sm:col-span-2">
          <span className="text-xs font-black uppercase text-ink/70">
            Nationality
          </span>
          <select
            value={form.nationality ?? ""}
            onChange={(e) =>
              setForm((s) => ({ ...s, nationality: e.target.value }))
            }
            className="mt-1 rounded-md border px-3 py-2"
            disabled={!editing}
          >
            <option value="">Select nationality</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col sm:col-span-2">
          <span className="text-xs font-black uppercase text-ink/70">
            Country of residence
          </span>
          <select
            value={form.countryOfResidence ?? ""}
            onChange={(e) =>
              setForm((s) => ({ ...s, countryOfResidence: e.target.value }))
            }
            className="mt-1 rounded-md border px-3 py-2"
            disabled={!editing}
          >
            <option value="">Select country</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 flex items-center gap-3">
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border px-3 py-2 text-sm font-black"
          >
            Edit
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                // revert changes
                setForm({
                  firstName: user?.firstName ?? "",
                  lastName: user?.lastName ?? "",
                  email: user?.email ?? "",
                  gender: (user as any)?.gender ?? "",
                  nationality: (user as any)?.nationality ?? "",
                  countryOfResidence: (user as any)?.countryOfResidence ?? "",
                });
                setEditing(false);
              }}
              className="rounded-md border px-3 py-2 text-sm font-black"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={updateProfile}
              disabled={loading}
              className="rounded-md bg-gradient-to-r from-[#ff6b73] to-[#ff3b47] px-4 py-2 text-sm font-black text-white"
            >
              {loading ? "Saving..." : "Save changes"}
            </button>
          </>
        )}

        {saved && <span className="text-sm text-ink/70">Saved</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
