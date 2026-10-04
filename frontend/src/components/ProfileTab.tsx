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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    setForm({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      gender: user?.gender ?? "",
      nationality: user?.nationality ?? "",
      countryOfResidence: user?.countryOfResidence ?? "",
    });
    setAvatarPreview(user?.profileImage ?? null);
    setAvatarFile(null);
  }, [user]);

  const onPickAvatar = (file?: File | null) => {
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async () => {
    if (!user?.id || !avatarFile) return;

    setUploadingAvatar(true);
    setError(null);

    try {
      const token = localStorage.getItem("luckyStrikeToken");
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const response = await fetch(
        `${API_BASE_URL}/api/users/${user.id}/avatar`,
        {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message || "Avatar upload failed");
      }

      const data = await response.json().catch(() => ({}));
      const nextUrl = typeof data?.url === "string" ? data.url : null;

      if (nextUrl) {
        const nextUser = { ...user, profileImage: nextUrl };
        setUser(nextUser);
        setAvatarPreview(nextUrl);

        const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (meResponse.ok) {
          const meData = await meResponse.json();
          if (meData?.user) {
            setUser(meData.user);
          }
        }
      }

      setAvatarFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
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
      ].forEach((key) => {
        const value = (form as Record<string, string | undefined>)[key];
        if (value !== undefined) {
          (payload as Record<string, string | undefined>)[key] = value;
        }
      });

      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}/profile`, {
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

      const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (meResponse.ok) {
        const meData = await meResponse.json();
        if (meData?.user) {
          setUser(meData.user);
        }
      }

      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err?.message ?? "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const renderActions = (mobile = false) => {
    const actionClasses = mobile
      ? "flex w-full flex-col gap-2 sm:hidden mt-2"
      : "hidden w-auto sm:flex sm:items-center sm:justify-end";

    return (
      <div className={actionClasses}>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-full rounded-md border border-pink-200 bg-gradient-to-r from-[#ff6b73] to-[#ff3b47] px-3 py-2 text-sm font-black text-white shadow-sm transition-all duration-200 hover:translate-y-[-1px] hover:shadow-md sm:w-auto"
          >
            Edit
          </button>
        ) : (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setForm({
                  firstName: user?.firstName ?? "",
                  lastName: user?.lastName ?? "",
                  email: user?.email ?? "",
                  gender: user?.gender ?? "",
                  nationality: user?.nationality ?? "",
                  countryOfResidence: user?.countryOfResidence ?? "",
                });
                setAvatarPreview(user?.profileImage ?? null);
                setAvatarFile(null);
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
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-lg bg-gradient-to-br from-[#fff7f8] to-[#fffdfa] p-6 shadow-md border border-[#ffe7ec]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-black text-pink-600">
            Profile
          </h2>
          <p className="mt-1 text-sm text-ink/70">
            Personal details and account information
          </p>
        </div>
        {renderActions(false)}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="order-2 grid gap-4 lg:order-1 lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col">
              <span className="text-xs font-black uppercase text-pink-600">
                First name
              </span>
              <input
                value={form.firstName ?? ""}
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
                value={form.lastName ?? ""}
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
                value={form.email ?? ""}
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
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
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
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="order-1 col-span-1 lg:order-2 lg:col-span-1">
          <div className="rounded-lg border bg-white p-4 text-center">
            <div className="mx-auto h-36 w-36 overflow-hidden rounded-full border-[3px] border-pink-100 bg-gradient-to-br from-[#fff0f3] to-[#fffaf0] shadow-[0_10px_20px_rgba(255,93,160,0.1)]">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-black text-pink-600">
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

            <div className="mt-4 space-y-2">
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
                className="w-full rounded-md border border-pink-200 bg-pink-50 px-3 py-2 text-sm font-black text-pink-700"
              >
                {avatarFile ? "Choose another photo" : "Upload avatar"}
              </button>

              {avatarFile && (
                <button
                  type="button"
                  onClick={uploadAvatar}
                  disabled={uploadingAvatar}
                  className="w-full rounded-md bg-gradient-to-r from-[#ff6b73] to-[#ff3b47] px-3 py-2 text-sm font-black text-white disabled:opacity-70"
                >
                  {uploadingAvatar ? "Uploading..." : "Update avatar"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {renderActions(true)}

      <div className="mt-4 flex items-center gap-3">
        {saved && <span className="text-sm text-ink/70">Saved</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
