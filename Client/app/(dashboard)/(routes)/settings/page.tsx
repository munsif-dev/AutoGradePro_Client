"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api"; // Assuming you have an API utility for fetching user data
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
  const [profilePicPreview, setProfilePicPreview] = useState(null); // For previewing the selected profile picture
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

    // Prepare the data to update
    const updatedData = {
      user: {
        id: user.id,
        username: user.username, // Do not update the username
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        password: newPassword ? newPassword : undefined, // Only include password if it's changed
      },
      university: user.university,
      department: user.department,
      profile_picture: user.profile_picture, // Include profile picture if it's changed
    };

    // FormData to handle profile picture upload
    const formData = new FormData();

    // If there's a profile picture update, append it
    if (user.profile_picture) {
      formData.append("profile_picture", user.profile_picture);
    }

    // Add other fields as necessary
    formData.append("user", JSON.stringify(updatedData.user));
    formData.append("university", user.university);
    formData.append("department", user.department);

    try {
      // PUT request to update the lecturer details, including profile picture if present
      await api.put("/api/lecturer/details/", formData); // Use the correct URL for your update endpoint
      alert("Details updated successfully");
    } catch (error) {
      console.error("Failed to update user details:", error);
      alert("Failed to update user details");
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0]; // Get the selected file
    if (file) {
      setUser({ ...user, profile_picture: file }); // Update state with the new file
      setProfilePicPreview(URL.createObjectURL(file)); // Preview the selected image
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen border-l-2 ml-2 p-6 flex-col justify-center">
        <h1 className="text-3xl font-bold mb-6 text-center text-dark-1">
          Update <strong className="text-light-2">Account</strong> Settings
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
                  htmlFor="university"
                  className="block text-sm font-medium text-dark-1"
                >
                  University
                </label>
                <input
                  type="text"
                  id="university"
                  value={user.university}
                  onChange={(e) =>
                    setUser({ ...user, university: e.target.value })
                  }
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label
                  htmlFor="department"
                  className="block text-sm font-medium text-dark-1"
                >
                  Department
                </label>
                <input
                  type="text"
                  id="department"
                  value={user.department}
                  onChange={(e) =>
                    setUser({ ...user, department: e.target.value })
                  }
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
            <img
              src={
                profilePicPreview ||
                user.profile_picture ||
                "/default-profile.png"
              } // Use preview or default image
              alt="Profile"
              className="w-32 h-32 rounded-full mx-auto mb-4"
            />
            <input
              type="file"
              onChange={handleProfilePictureChange}
              className="mt-4"
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SettingsPage;
