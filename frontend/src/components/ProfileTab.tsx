import { useEffect, useRef, useState } from "react";
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    setForm({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      gender: (user as any)?.gender ?? "",
      nationality: (user as any)?.nationality ?? "",
      countryOfResidence: (user as any)?.countryOfResidence ?? "",
    });
    setAvatarPreview((user as any)?.avatar ?? null);
  }, [user]);

  const onPickAvatar = (file?: File | null) => {
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

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

      // refresh authoritative user
      await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      })
        .then((r) => r.ok && r.json())
        .then((d) => d?.user && setUser(d.user))
        .catch(() => {});

      // optional avatar upload if API supports it
      if (avatarFile) {
        try {
          const formData = new FormData();
          formData.append("avatar", avatarFile);
          await fetch(`${API_BASE_URL}/api/users/${user?.id}/avatar`, {
            method: "POST",
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            } as any,
            body: formData,
          })
            .then((r) => r.ok && r.json())
            .then((d) => d?.user && setUser(d.user))
            .catch(() => {});
        } catch (e) {
          // ignore avatar upload failures
        }
      }

      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      if (!error) setError(err?.message ?? "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-gradient-to-br from-[#fff7f8] to-[#fffdfa] p-6 shadow-md border border-[#ffe7ec]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-black text-pink-600">
            Profile
          </h2>
          <p className="mt-1 text-sm text-ink/70">
            Personal details and account information
          </p>
        </div>
        <div>
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
                className="rounded-md border px-3 py-2 text-sm font-black mr-2"
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
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col">
              <span className="text-xs font-black uppercase text-pink-600">
                First name
              </span>
              <input
                value={form.firstName}
                onChange={(e) =>
                  setForm((s) => ({ ...s, firstName: e.target.value }))
                }
                className="mt-1 rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink"
                disabled={!editing}
              />
            </label>

            <label className="flex flex-col">
              <span className="text-xs font-black uppercase text-pink-600">
                Last name
              </span>
              <input
                value={form.lastName}
                onChange={(e) =>
                  setForm((s) => ({ ...s, lastName: e.target.value }))
                }
                className="mt-1 rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink"
                disabled={!editing}
              />
            </label>

            <label className="flex flex-col sm:col-span-2">
              <span className="text-xs font-black uppercase text-pink-600">
                Email
              </span>
              <input
                value={form.email}
                onChange={(e) =>
                  setForm((s) => ({ ...s, email: e.target.value }))
                }
                className="mt-1 rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink"
                disabled={!editing}
              />
            </label>

            <label className="flex flex-col">
              <span className="text-xs font-black uppercase text-pink-600">
                Gender
              </span>
              <select
                value={form.gender ?? ""}
                onChange={(e) =>
                  setForm((s) => ({ ...s, gender: e.target.value }))
                }
                className="mt-1 rounded-md border px-3 py-2"
                disabled={!editing}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="flex flex-col sm:col-span-2">
              <span className="text-xs font-black uppercase text-pink-600">
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
              <span className="text-xs font-black uppercase text-pink-600">
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
        </div>

        <div className="col-span-1 lg:col-span-1">
          <div className="rounded-lg border p-4 text-center bg-white">
            <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border-4 border-pink-50 bg-gradient-to-br from-[#fff0f3] to-[#fffaf0]">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-black text-pink-600">
                  {(user?.firstName || "U")[0]}
                </div>
              )}
            </div>

            <div className="mt-3">
              <div className="text-sm font-black text-ink">
                {(user?.firstName || "") +
                  (user?.lastName ? ` ${user.lastName}` : "")}
              </div>
              <div className="mt-1 text-xs text-ink/70">{user?.email}</div>
              <div className="mt-1 text-xs text-ink/70">
                {user?.phoneNumber ?? "—"}
              </div>
            </div>

            <div className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickAvatar(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md border border-pink-200 bg-pink-50 px-3 py-2 text-sm font-black text-pink-700"
              >
                {avatarPreview ? "Change avatar" : "Upload avatar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        {saved && <span className="text-sm text-ink/70">Saved</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
