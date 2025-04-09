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
  CheckCircle,
  X,
  Shield,
  CreditCard
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BackButton from "@/app/(dashboard)/_components/BackButton";

const SettingsPage = () => {
  // State for multiple form sections
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const router = useRouter();

  // Form state objects
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
  });

  const [academic, setAcademic] = useState({
    university: "",
    department: "",
  });

  const [password, setPassword] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // State for form submissions
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingAcademic, setIsSubmittingAcademic] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [isSubmittingPicture, setIsSubmittingPicture] = useState(false);

  // State for password visibility
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Form validation errors
  const [errors, setErrors] = useState({
    profile: {},
    academic: {},
    password: {},
  });

  // Loading the initial user data
  useEffect(() => {
    fetchUserProfile();
  }, []);


  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      // Try the new endpoint first
      let response;
      try {
        response = await api.get("/api/profile/");
      } catch (error) {
        console.log("New endpoint failed, falling back to legacy endpoint");
        // Fall back to the old endpoint if the new one isn't ready yet
        response = await api.get("/api/lecturer/details/");
        
        // Adapt the data structure from old endpoint to new expected format
        const oldData = response.data;
        response.data = {
          user_info: oldData.user,
          university: oldData.university,
          department: oldData.department,
          profile_picture: oldData.profile_picture
        };
      }
      
      const data = response.data;
      
      // Update state with fetched data
      setProfile({
        first_name: data.user_info.first_name || "",
        last_name: data.user_info.last_name || "",
        email: data.user_info.email || "",
        username: data.user_info.username || "",
      });
      
      setAcademic({
        university: data.university || "",
        department: data.department || "",
      });
      
      // Set profile picture if available
      if (data.profile_picture) {
        setProfilePicPreview(data.profile_picture);
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      toast.error("Failed to load your profile. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Profile information form validation
  const validateProfileForm = () => {
    const newErrors = {};
    
    if (!profile.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(profile.email)) {
      newErrors.email = "Invalid email format";
    }
    
    if (!profile.first_name) {
      newErrors.first_name = "First name is required";
    }
    
    if (!profile.last_name) {
      newErrors.last_name = "Last name is required";
    }
    
    setErrors(prev => ({ ...prev, profile: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // Password form validation
  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!password.current_password) {
      newErrors.current_password = "Current password is required";
    }
    
    if (!password.new_password) {
      newErrors.new_password = "New password is required";
    } else if (password.new_password.length < 8) {
      newErrors.new_password = "Password must be at least 8 characters";
    }
    
    if (!password.confirm_password) {
      newErrors.confirm_password = "Please confirm your new password";
    } else if (password.new_password !== password.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }
    
    setErrors(prev => ({ ...prev, password: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // Handle profile information update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    setIsSubmittingProfile(true);
    
    try {
      const response = await api.patch("/api/profile/user/", {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
      });
      
      toast.success("Profile information updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      const errorMessage = error.response?.data?.detail || "Failed to update profile information";
      toast.error(errorMessage);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // Handle academic information update
  const handleAcademicUpdate = async (e) => {
    e.preventDefault();
    setIsSubmittingAcademic(true);
    
    try {
      const response = await api.patch("/api/profile/", {
        university: academic.university,
        department: academic.department,
      });
      
      toast.success("Academic information updated successfully");
    } catch (error) {
      console.error("Failed to update academic info:", error);
      const errorMessage = error.response?.data?.detail || "Failed to update academic information";
      toast.error(errorMessage);
    } finally {
      setIsSubmittingAcademic(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    setIsSubmittingPassword(true);
    
    try {
      const response = await api.post("/api/profile/password/", {
        current_password: password.current_password,
        new_password: password.new_password,
        confirm_password: password.confirm_password,
      });
      
      toast.success("Password changed successfully");
      
      // Reset the password form
      setPassword({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      console.error("Failed to change password:", error);
      const errorData = error.response?.data || {};
      
      // Handle specific error messages from the backend
      if (errorData.current_password) {
        setErrors(prev => ({
          ...prev,
          password: { ...prev.password, current_password: errorData.current_password }
        }));
        toast.error("Current password is incorrect");
      } else {
        toast.error("Failed to change password. Please try again.");
      }
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Handle profile picture upload
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should not exceed 5MB");
      return;
    }
    
    // Show preview
    setProfilePicPreview(URL.createObjectURL(file));
    
    // Upload to server
    const formData = new FormData();
    formData.append("profile_picture", file);
    
    setIsSubmittingPicture(true);
    
    try {
      const response = await api.post("/api/profile/picture/", formData);
      toast.success("Profile picture updated successfully");
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
      toast.error("Failed to upload profile picture. Please try again.");
      // Revert to previous picture if available
      fetchUserProfile();
    } finally {
      setIsSubmittingPicture(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
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
          <h1 className="ml-4 text-2xl font-bold text-gray-800">Account Settings</h1>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center px-6 py-4 font-medium ${
                  activeTab === "profile"
                    ? "border-b-2 border-light-2 text-light-2"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <User className="w-5 h-5 mr-2" />
                <span>Profile</span>
              </button>
              
              <button
                onClick={() => setActiveTab("academic")}
                className={`flex items-center px-6 py-4 font-medium ${
                  activeTab === "academic"
                    ? "border-b-2 border-light-2 text-light-2"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                <span>Academic</span>
              </button>
              
              <button
                onClick={() => setActiveTab("security")}
                className={`flex items-center px-6 py-4 font-medium ${
                  activeTab === "security"
                    ? "border-b-2 border-light-2 text-light-2"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Shield className="w-5 h-5 mr-2" />
                <span>Security</span>
              </button>
            </div>

            {/* Main Content Area */}
            <div className="p-8">
              <div className="md:flex gap-8">
                {/* Profile Picture Section (Always Shown) */}
                <div className="md:w-1/3 mb-8 md:mb-0">
                  <div className="text-center p-6 border border-gray-200 rounded-xl bg-white shadow-sm">
                    <div className="relative w-40 h-40 mx-auto mb-4">
                      <div className="w-full h-full rounded-full overflow-hidden border-4 border-purple-100">
                        <img
                          src={profilePicPreview || "/default-profile.png"}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <label
                        htmlFor="profile-upload"
                        className={`absolute bottom-2 right-2 p-3 rounded-full cursor-pointer shadow-md ${
                          isSubmittingPicture
                            ? "bg-gray-400"
                            : "bg-light-2 hover:bg-light-1"
                        } text-white transition-colors`}
                      >
                        {isSubmittingPicture ? (
                          <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" />
                        ) : (
                          <Upload className="w-5 h-5" />
                        )}
                      </label>
                      <input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        disabled={isSubmittingPicture}
                        className="hidden"
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {profile.first_name} {profile.last_name}
                    </h3>
                    <p className="text-gray-500">@{profile.username}</p>
                    <div className="mt-4 text-sm text-gray-600">
                      <p>Upload a new photo</p>
                      <p className="text-xs text-gray-400 mt-1">
                        JPG, PNG or GIF. Max size 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="md:w-2/3">
                  {/* Profile Tab */}
                  {activeTab === "profile" && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800 mb-6">Personal Information</h2>
                      <form onSubmit={handleProfileUpdate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              First Name
                            </label>
                            <input
                              type="text"
                              value={profile.first_name}
                              onChange={(e) =>
                                setProfile({ ...profile, first_name: e.target.value })
                              }
                              className={`w-full p-3 border ${
                                errors.profile?.first_name
                                  ? "border-red-500 bg-red-50"
                                  : "border-gray-300"
                              } rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-transparent`}
                              placeholder="Your first name"
                            />
                            {errors.profile?.first_name && (
                              <div className="mt-1 text-red-500 text-xs flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {errors.profile.first_name}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={profile.last_name}
                              onChange={(e) =>
                                setProfile({ ...profile, last_name: e.target.value })
                              }
                              className={`w-full p-3 border ${
                                errors.profile?.last_name
                                  ? "border-red-500 bg-red-50"
                                  : "border-gray-300"
                              } rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-transparent`}
                              placeholder="Your last name"
                            />
                            {errors.profile?.last_name && (
                              <div className="mt-1 text-red-500 text-xs flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {errors.profile.last_name}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <Mail className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                              type="email"
                              value={profile.email}
                              onChange={(e) =>
                                setProfile({ ...profile, email: e.target.value })
                              }
                              className={`w-full pl-10 p-3 border ${
                                errors.profile?.email
                                  ? "border-red-500 bg-red-50"
                                  : "border-gray-300"
                              } rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-transparent`}
                              placeholder="email@example.com"
                            />
                            {errors.profile?.email && (
                              <div className="mt-1 text-red-500 text-xs flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {errors.profile.email}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                          </label>
                          <input
                            type="text"
                            value={profile.username}
                            disabled
                            className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed text-gray-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Username cannot be changed
                          </p>
                        </div>

                        <div className="flex justify-end pt-4">
                          <button
                            type="submit"
                            disabled={isSubmittingProfile}
                            className="px-6 py-3 bg-light-2 hover:bg-light-1 text-white font-medium rounded-lg transition-colors flex items-center"
                          >
                            {isSubmittingProfile ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                Updating...
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
                  )}

                  {/* Academic Tab */}
                  {activeTab === "academic" && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800 mb-6">Academic Information</h2>
                      <form onSubmit={handleAcademicUpdate} className="space-y-6">
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
                              value={academic.university}
                              onChange={(e) =>
                                setAcademic({ ...academic, university: e.target.value })
                              }
                              className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                              placeholder="Your university"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Department
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <BookOpen className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={academic.department}
                              onChange={(e) =>
                                setAcademic({ ...academic, department: e.target.value })
                              }
                              className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                              placeholder="Your department"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-4">
                          <button
                            type="submit"
                            disabled={isSubmittingAcademic}
                            className="px-6 py-3 bg-light-2 hover:bg-light-1 text-white font-medium rounded-lg transition-colors flex items-center"
                          >
                            {isSubmittingAcademic ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                Updating...
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
                  )}

                  {/* Security Tab */}
                  {activeTab === "security" && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800 mb-6">Password & Security</h2>
                      <form onSubmit={handlePasswordChange} className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={passwordVisibility.current ? "text" : "password"}
                              value={password.current_password}
                              onChange={(e) =>
                                setPassword({ ...password, current_password: e.target.value })
                              }
                              className={`w-full p-3 pr-10 border ${
                                errors.password?.current_password
                                  ? "border-red-500 bg-red-50"
                                  : "border-gray-300"
                              } rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-transparent`}
                              placeholder="Enter your current password"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                              onClick={() => togglePasswordVisibility("current")}
                            >
                              {passwordVisibility.current ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                            {errors.password?.current_password && (
                              <div className="mt-1 text-red-500 text-xs flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {errors.password.current_password}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={passwordVisibility.new ? "text" : "password"}
                              value={password.new_password}
                              onChange={(e) =>
                                setPassword({ ...password, new_password: e.target.value })
                              }
                              className={`w-full p-3 pr-10 border ${
                                errors.password?.new_password
                                  ? "border-red-500 bg-red-50"
                                  : "border-gray-300"
                              } rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-transparent`}
                              placeholder="Enter a new password"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                              onClick={() => togglePasswordVisibility("new")}
                            >
                              {passwordVisibility.new ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                            {errors.password?.new_password && (
                              <div className="mt-1 text-red-500 text-xs flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {errors.password.new_password}
                              </div>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Password must be at least 8 characters long
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              type={passwordVisibility.confirm ? "text" : "password"}
                              value={password.confirm_password}
                              onChange={(e) =>
                                setPassword({ ...password, confirm_password: e.target.value })
                              }
                              className={`w-full p-3 pr-10 border ${
                                errors.password?.confirm_password
                                  ? "border-red-500 bg-red-50"
                                  : "border-gray-300"
                              } rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-transparent`}
                              placeholder="Confirm your new password"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                              onClick={() => togglePasswordVisibility("confirm")}
                            >
                              {passwordVisibility.confirm ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                            {errors.password?.confirm_password && (
                              <div className="mt-1 text-red-500 text-xs flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {errors.password.confirm_password}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end pt-4">
                          <button
                            type="submit"
                            disabled={isSubmittingPassword}
                            className="px-6 py-3 bg-light-2 hover:bg-light-1 text-white font-medium rounded-lg transition-colors flex items-center"
                          >
                            {isSubmittingPassword ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                Updating...
                              </>
                            ) : (
                              <>
                                <Lock className="w-4 h-4 mr-2" />
                                Change Password
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
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