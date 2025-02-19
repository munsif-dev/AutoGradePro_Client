"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Import Link for navigation
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/lib/constant";
import api from "@/lib/api";

interface FormData {
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  university: string;
  department: string;
}

const LecturerRegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
    email: "",
    first_name: "",
    last_name: "",
    university: "",
    department: "",
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

    const payload = {
      user: {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
      },
      University: formData.university,
      Department: formData.department,
    };

    try {
      const response = await api.post("/api/lecturer/register/", payload);

      if (response.status === 201) {
        const { access, refresh } = response.data;

        localStorage.setItem(ACCESS_TOKEN, access);
        localStorage.setItem(REFRESH_TOKEN, refresh);

        router.push("/sign-in");
      }
    } catch (err) {
      setLoading(false);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.detail);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Left Section */}
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

      {/* Right Section */}
      <div className="flex-1 flex items-center justify-center p-10 bg-white h-full overflow-y-auto ">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-semibold text-center mb-6 mt-20">
            Registration
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="First Name"
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Last Name"
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="text"
              name="university"
              value={formData.university}
              onChange={handleChange}
              placeholder="University"
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="Department"
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500"
              required
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Sign Up"}
            </button>
          </form>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-500">or</p>
            <button
              type="button"
              className="mt-2 p-3 border border-gray-300 rounded-lg w-full flex items-center justify-center space-x-2"
            >
              <img src="GoogleIcon.png" alt="Google Icon" className="w-5" />
              <span>Sign Up with Google</span>
            </button>
          </div>

          <p className="text-sm text-center mt-4">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-purple-500 hover:underline font-medium"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LecturerRegistrationForm;
