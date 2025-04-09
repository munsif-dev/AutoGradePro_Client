"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import {
  User,
  Mail,
  Building,
  BookOpen,
  Lock,
  Eye,
  EyeOff,
  Upload,
  Save,
  AlertCircle,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BackButton from "@/app/(dashboard)/_components/BackButton";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [originalData, setOriginalData] = useState(null); // Store original data to track changes
  const router = useRouter();

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/api/lecturer/details/");
      const data = response.data;
      
      const userData = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        university: data.university || "",
        department: data.department || "",
        profile_picture: data.profile_picture,
      };
      
      setUser(userData);
      setOriginalData(userData); // Store original data
      
      // Set profile picture preview if it exists
      if (data.profile_picture) {
        setProfilePicPreview(data.profile_picture);
      }
    } catch (err) {
      console.error("Failed to fetch lecturer details:", err);
      toast.error("Failed to load your profile. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (newPassword && newPassword.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!user.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(user.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create a function to detect changes in user data
  const getChangedFields = () => {
    if (!originalData) return user;
    
    const changes = {};
    
    // Compare and only include fields that changed
    if (user.email !== originalData.email) changes.email = user.email;
    if (user.first_name !== originalData.first_name) changes.first_name = user.first_name;
    if (user.last_name !== originalData.last_name) changes.last_name = user.last_name;
    if (user.university !== originalData.university) changes.university = user.university;
    if (user.department !== originalData.department) changes.department = user.department;
    
    // Always include ID and username for reference
    changes.id = user.id;
    changes.username = user.username;
    
    return changes;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    setIsSaving(true);

    // Only include password if provided
    const userData = {
      ...getChangedFields(),
      ...(newPassword ? { password: newPassword } : {})
    };

    try {
      // Create FormData for mixed content (file + JSON)
      const formData = new FormData();
      
      // Only append profile picture if it's a File object (newly uploaded)
      if (user.profile_picture instanceof File) {
        formData.append("profile_picture", user.profile_picture);
      }
      
      // Prepare user data - only include non-empty values and exclude undefined
      const cleanUserData = Object.fromEntries(
        Object.entries(userData).filter(([_, v]) => v !== undefined && v !== "")
      );
      
      // Add user JSON and other fields
      formData.append("user", JSON.stringify(cleanUserData));
      formData.append("university", user.university || "");
      formData.append("department", user.department || "");
      
      // Optional logging for debugging
      console.log("Sending update with data:", {
        user: cleanUserData,
        university: user.university,
        department: user.department,
        hasProfilePic: user.profile_picture instanceof File
      });

      // Send update request
      const response = await api.put("/api/lecturer/details/", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      // Update the original data reference after successful update
      setOriginalData({...user});
      
      toast.success("Your profile has been updated successfully");
      setNewPassword("");
      setConfirmPassword("");
      
      // Update the user state with the response data to ensure we have the latest
      if (response.data) {
        setUser({
          id: response.data.user.id,
          username: response.data.user.username,
          email: response.data.user.email,
          first_name: response.data.user.first_name,
          last_name: response.data.user.last_name,
          university: response.data.university || "",
          department: response.data.department || "",
          profile_picture: response.data.profile_picture,
        });
      }
    } catch (error) {
      console.error("Failed to update user details:", error);
      
      // More detailed error message if available
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          "Failed to update your profile. Please try again.";
      
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should not exceed 5MB");
        return;
      }
      setUser({ ...user, profile_picture: file });
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should not exceed 5MB");
        return;
      }
      setUser({ ...user, profile_picture: file });
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-light-2"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-6 flex-col">
        <div className="mb-6 flex items-center">
          <BackButton />
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r bg-purple-50 p-6 text-light-2 ">
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="opacity-80">Manage your profile and preferences</p>
          </div>

          {/* Rest of the UI remains the same */}
          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Profile Picture Section */}
              <div className="md:w-1/3">
                <div
                  className={`rounded-xl overflow-hidden border-2 ${
                    isDragOver
                      ? "border-light-2 bg-purple-50"
                      : "border-gray-200"
                  } transition-all duration-200`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="text-center p-6 space-y-4">
                    <div className="relative w-32 h-32 mx-auto">
                      <div className="w-full h-full rounded-full overflow-hidden border-4 border-purple-100">
                        <img
                          src={
                            profilePicPreview ||
                            user.profile_picture ||
                            "/default-profile.png"
                          }
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <label
                        htmlFor="profile-upload"
                        className="absolute bottom-0 right-0 bg-light-2 text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-purple-600 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                      </label>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-dark-1">
                        {user.first_name} {user.last_name}
                      </h2>
                      <p className="text-gray-500 text-sm">@{user.username}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>Drag & drop your photo here or</p>
                      <label
                        htmlFor="profile-upload"
                        className="text-light-2 font-medium cursor-pointer hover:underline"
                      >
                        click to browse
                      </label>
                      <input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                      <p className="mt-2 text-xs text-gray-400">
                        Maximum file size: 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Info Form */}
              <div className="md:w-2/3">
                <form onSubmit={handleUpdate} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-dark-1 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-light-2" />
                      Personal Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={user.first_name}
                          onChange={(e) =>
                            setUser({ ...user, first_name: e.target.value })
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all"
                          placeholder="Your first name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={user.last_name}
                          onChange={(e) =>
                            setUser({ ...user, last_name: e.target.value })
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all"
                          placeholder="Your last name"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Mail className="w-5 h-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            value={user.email}
                            onChange={(e) =>
                              setUser({ ...user, email: e.target.value })
                            }
                            className={`w-full pl-10 p-3 border ${
                              errors.email
                                ? "border-red-500 bg-red-50"
                                : "border-gray-300"
                            } rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all`}
                            placeholder="email@example.com"
                          />
                          {errors.email && (
                            <div className="mt-1 text-red-500 text-xs flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {errors.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-dark-1 mb-4 flex items-center">
                      <Building className="w-5 h-5 mr-2 text-light-2" />
                      Academic Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Username
                        </label>
                        <input
                          type="text"
                          value={user.username}
                          disabled
                          className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed text-gray-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Username cannot be changed
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          University
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Building className="w-5 h-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={user.university}
                            onChange={(e) =>
                              setUser({ ...user, university: e.target.value })
                            }
                            className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all"
                            placeholder="Your university"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Department
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <BookOpen className="w-5 h-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={user.department}
                            onChange={(e) =>
                              setUser({ ...user, department: e.target.value })
                            }
                            className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all"
                            placeholder="Your department"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-dark-1 mb-4 flex items-center">
                      <Lock className="w-5 h-5 mr-2 text-light-2" />
                      Password
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={`w-full p-3 pr-10 border ${
                              errors.password
                                ? "border-red-500 bg-red-50"
                                : "border-gray-300"
                            } rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all`}
                            placeholder="Leave blank to keep current"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                          {errors.password && (
                            <div className="mt-1 text-red-500 text-xs flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {errors.password}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full p-3 pr-10 border ${
                              errors.confirmPassword
                                ? "border-red-500 bg-red-50"
                                : "border-gray-300"
                            } rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all`}
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                          {errors.confirmPassword && (
                            <div className="mt-1 text-red-500 text-xs flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {errors.confirmPassword}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg mr-3 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-3 bg-light-2 hover:bg-light-1 text-white font-medium rounded-lg transition-colors flex items-center"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
      />
    </ProtectedRoute>
  );
};

export default SettingsPage;