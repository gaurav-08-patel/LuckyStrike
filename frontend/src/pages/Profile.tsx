import { useState } from "react";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/ui/Toast";
import { useNavigate } from "react-router-dom";

function ProfilePage() {
  const { user, setUser, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    gender: user?.gender || "",
    nationality: user?.nationality || "",
    countryOfResidence: user?.countryOfResidence || "",
  });

  const handleChange = (key: string, value: string) => {
    setForm((s) => ({ ...s, [key]: value }));
  };

  const handleSave = () => {
    const updated = { ...user, ...form };
    setUser(updated as any);
    toast.success("Profile saved", "Your profile changes were saved locally.");
  };

  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

  return (
    <main className="min-h-screen bg-[#f3f0ee] text-ink">
      <SiteHeader
        brand={
          <>
            Lucky<span className="text-red">Strike</span>
          </>
        }
      />

      <section className="mx-auto max-w-[800px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <h1 className="mb-6 text-3xl font-black">Profile</h1>

        <div className="rounded-[16px] border-[3px] border-ink bg-paper p-6 shadow-[5px_5px_0_#171310]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-bold">First name</label>
              <input
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                className="mt-1 w-full rounded-[8px] border px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-bold">Last name</label>
              <input
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                className="mt-1 w-full rounded-[8px] border px-3 py-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold">Email</label>
              <input
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="mt-1 w-full rounded-[8px] border px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-bold">Gender</label>
              <input
                value={form.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                className="mt-1 w-full rounded-[8px] border px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-bold">Nationality</label>
              <input
                value={form.nationality}
                onChange={(e) => handleChange("nationality", e.target.value)}
                className="mt-1 w-full rounded-[8px] border px-3 py-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold">
                Country of residence
              </label>
              <input
                value={form.countryOfResidence}
                onChange={(e) =>
                  handleChange("countryOfResidence", e.target.value)
                }
                className="mt-1 w-full rounded-[8px] border px-3 py-2"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-[12px] border-[3px] border-ink bg-[#ff3d8c] px-4 py-2 font-bold text-white"
            >
              Save
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-[12px] border-[3px] border-ink bg-[#ececec] px-4 py-2 font-bold"
            >
              Logout
            </button>
          </div>

          <p className="mt-4 text-sm text-ink/70">
            Other functionalities will be implemented later.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default ProfilePage;
