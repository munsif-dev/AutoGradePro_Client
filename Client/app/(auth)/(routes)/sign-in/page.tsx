"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/lib/constant";
import api from "@/lib/api";
import Link from "next/link";

interface SignInFormData {
  username: string;
  password: string;
}

const SignInPage: React.FC = () => {
  const [formData, setFormData] = useState<SignInFormData>({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Send login request to the backend
      const response = await api.post("/api/token/", formData);

      if (response.status === 200) {
        const { access, refresh } = response.data;

        // Save tokens to localStorage
        localStorage.setItem(ACCESS_TOKEN, access);
        localStorage.setItem(REFRESH_TOKEN, refresh);

        // Redirect to dashboard or home page
        router.push("/dashboard");
      }
    } catch (err) {
      setLoading(false);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.detail || "Invalid credentials");
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side illustration */}
      <div className="flex-1 bg-purple-200 flex flex-col items-center justify-center p-6">
        <img
          src="Hero_image.png" // Replace with the path to your illustration image
          alt="Illustration"
          className="max-w-md"
        />
        <h2 className="text-2xl font-bold mt-6">Automated Grading System</h2>
        <p className="text-center mt-2 text-gray-700">
          "Empower your grading journey with precision and purpose"
        </p>
      </div>

      {/* Right side sign-in form */}
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="max-w-md w-full p-8 shadow-lg rounded-lg">
          <h1 className="text-3xl font-semibold text-center mb-6">Sign In</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col">
              <label htmlFor="username" className="text-lg font-medium">
                Username:
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="mt-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="password" className="text-lg font-medium">
                Password:
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full mt-4 p-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">or</p>
              <button
                type="button"
                className="mt-2 p-3 border border-gray-300 rounded-lg w-full flex items-center justify-center space-x-2"
              >
                <img src="GoogleIcon.png" alt="Google Icon" className="w-5" />
                <span>Sign In with Google</span>
              </button>
            </div>
          </form>
          <p className="text-sm  text-center mt-4">
            Are you new to AutoGradePro?{" "}
            <Link
              href="/sign-up"
              className="text-purple-500 hover:underline font-medium"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
