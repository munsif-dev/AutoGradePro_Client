"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";

const SettingsPage = () => {
  const [user, setUser] = useState({
    id: 1,
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    profile_picture: null,
    university: "",
    department: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const router = useRouter();

  useEffect(() => {
    api
      .get("/api/lecturer/details/")
      .then((response) => {
        const data = response.data;
        setUser({
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          first_name: data.user.first_name,
          last_name: data.user.last_name,
          university: data.university,
          department: data.department,
          profile_picture: data.profile_picture,
        });
      })
      .catch((err) => {
        console.error("Failed to fetch lecturer details:", err);
      });
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const updatedData = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        password: newPassword ? newPassword : undefined,
      },
      university: user.university,
      department: user.department,
      profile_picture: user.profile_picture,
    };

    const formData = new FormData();
    if (user.profile_picture instanceof File) {
      formData.append("profile_picture", user.profile_picture);
    }
    formData.append("user", JSON.stringify(updatedData.user));
    formData.append("university", user.university);
    formData.append("department", user.department);

    try {
      await api.put("/api/lecturer/details/", formData);
      alert("Details updated successfully");
    } catch (error) {
      console.error("Failed to update user details:", error);
      alert("Failed to update user details");
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUser({ ...user, profile_picture: file });
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen border-l-2 ml-2 p-6 flex-col justify-center">
        <h1 className="text-4xl font-bold mb-8 text-center text-dark-1">
          Account <span className="text-light-2">Settings</span>
        </h1>

        <div className="max-w-3xl mx-auto space-y-8">
          {/* Profile Picture Section */}
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <img
              src={
                profilePicPreview ||
                user.profile_picture ||
                "/default-profile.png"
              }
              alt="Profile"
              className="w-32 h-32 rounded-full mx-auto mb-4 border-2 border-light-2 object-cover"
            />
            <h2 className="text-xl font-semibold text-dark-1 mb-2">
              @{user.username}
            </h2>
            <input
              type="file"
              onChange={handleProfilePictureChange}
              className="mt-2 w-full text-sm"
            />
          </div>

          {/* User Info Form */}
          <form
            onSubmit={handleUpdate}
            className="bg-white p-6 rounded-xl shadow-md space-y-4"
          >
            <h2 className="text-xl font-semibold text-dark-1 mb-4">
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  value={user.first_name}
                  onChange={(e) =>
                    setUser({ ...user, first_name: e.target.value })
                  }
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  value={user.last_name}
                  onChange={(e) =>
                    setUser({ ...user, last_name: e.target.value })
                  }
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="mt-1 block w-full p-2 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  University
                </label>
                <input
                  type="text"
                  value={user.university}
                  onChange={(e) =>
                    setUser({ ...user, university: e.target.value })
                  }
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <input
                  type="text"
                  value={user.department}
                  onChange={(e) =>
                    setUser({ ...user, department: e.target.value })
                  }
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <h2 className="text-xl font-semibold text-dark-1 mt-6 mb-4">
              Password
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="submit"
                className="px-6 py-2 bg-light-2 hover:bg-light-1 text-white font-medium rounded-full transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SettingsPage;
