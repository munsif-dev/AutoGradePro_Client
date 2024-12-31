"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
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
      <div className="flex-1 bg-purple-100 flex items-center justify-center p-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">AutoGradePro</h1>
          <p className="text-lg mb-6">Automated Grading System</p>
          <p className="text-sm text-gray-600">
            Empower your grading journey with precision and purpose.
          </p>
          <img
            src="Hero_image.png" // Replace with your illustration image URL
            alt="Illustration"
            className="mt-6 w-full max-w-sm mx-auto"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex-1 flex items-center justify-center p-10 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-semibold text-center mb-6">
            Lecturer Registration
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
        </div>
      </div>
    </div>
  );
};

export default LecturerRegistrationForm;




/*
"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
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

    // Restructure the data to match the backend's expectations
    const payload = {
      user: {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
      },
      University: formData.university, // Match the case-sensitive key
      Department: formData.department, // Match the case-sensitive key
    };

    try {
      const response = await api.post("/api/lecturer/register/", payload);

      if (response.status === 201) {
        // Assuming the backend returns the tokens in the response
        const { access, refresh } = response.data;

        // Save the access and refresh tokens to localStorage
        localStorage.setItem(ACCESS_TOKEN, access);
        localStorage.setItem(REFRESH_TOKEN, refresh);

        // Redirect to login or dashboard after successful registration
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
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-semibold text-center mb-6">
        Lecturer Registration
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col">
          <label htmlFor="first_name" className="text-lg font-medium">
            First Name:
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className="mt-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="last_name" className="text-lg font-medium">
            Last Name:
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className="mt-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

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
            className="mt-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
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
            className="mt-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="email" className="text-lg font-medium">
            Email:
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="university" className="text-lg font-medium">
            University:
          </label>
          <input
            type="text"
            id="university"
            name="university"
            value={formData.university}
            onChange={handleChange}
            className="mt-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="department" className="text-lg font-medium">
            Department:
          </label>
          <input
            type="text"
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="mt-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full mt-4 p-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Register"}
        </button>
      </form>
    </div>
  );
};

export default LecturerRegistrationForm;
*/