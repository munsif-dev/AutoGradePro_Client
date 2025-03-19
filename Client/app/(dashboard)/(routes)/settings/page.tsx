"use client";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api"; // Assuming you have an API utility for fetching user data

const SettingsPage = () => {
  const [user, setUser] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Fetch the user data when the page loads
    api.get("/api/lecturer/details/").then((response) => {
      setUser(response.data); // Set user details from API response
    });
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // Update user details
    const updatedData = {
      user: {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    };
    if (newPassword) {
      updatedData.user.password = newPassword; // Only include password if it's changed
    }

    try {
      await api.put("/api/lecturer/update/", updatedData); // Call API to update user details
      alert("Details updated successfully");
    } catch (error) {
      console.error("Failed to update user details:", error);
      alert("Failed to update user details");
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-6 flex-col justify-center">
        <h1 className="text-3xl font-bold mb-6 text-center text-dark-1">
          Update your <strong className="text-light-2">Account</strong> Settings
        </h1>

        <div className="max-w-lg mx-auto space-y-4">
          {/* User Information Form */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-dark-1 mb-4">
              User Information
            </h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-sm font-medium text-dark-1"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  value={user.first_name}
                  onChange={(e) =>
                    setUser({ ...user, first_name: e.target.value })
                  }
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label
                  htmlFor="last_name"
                  className="block text-sm font-medium text-dark-1"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  value={user.last_name}
                  onChange={(e) =>
                    setUser({ ...user, last_name: e.target.value })
                  }
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-dark-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label
                  htmlFor="new_password"
                  className="block text-sm font-medium text-dark-1"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="new_password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label
                  htmlFor="confirm_password"
                  className="block text-sm font-medium text-dark-1"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirm_password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-light-2 hover:bg-light-1 text-white rounded-full"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Profile Picture (Optional) */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-dark-1 mb-4">
              Profile Picture
            </h2>
            <button className="mt-4 px-6 py-2 bg-light-2 hover:bg-light-1 text-white rounded-full">
              Change Profile Picture
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SettingsPage;
