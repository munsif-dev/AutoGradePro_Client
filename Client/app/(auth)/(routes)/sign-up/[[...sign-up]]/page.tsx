"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [isLecturer, setIsLecturer] = useState(false);
  const [University, setUniversity] = useState("");
  const [level, setLevel] = useState("");

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>
        <form>
          <div className="mb-4">
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Register as: </label>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setIsLecturer(e.target.value === "lecturer");
              }}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
            </select>
          </div>

          {isLecturer && (
            <div className="mb-4">
              <label className="block text-sm font-medium">
                Working University
              </label>
              <input
                type="text"
                value={University}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          )}
          {isLecturer && (
            <div className="mb-4">
              <label className="block text-sm font-medium">
                Higher Studies
              </label>
              <input
                type="text"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg"
          >
            Register
          </button>
        </form>

        <div className="mt-6 text-center">
          <button className="w-full bg-red-500 text-white py-2 rounded-lg">
            Register with Google
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-blue-500 underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
